const request = require('supertest');
const nock = require('nock');

const helper = require('.');
const fixtures = require('../fixtures');

describe('Integration: subscriptions', () => {
  beforeEach(async () => {
    // Create an installation
    await helper.robot.models.Installation.create({
      githubId: 1,
      ownerId: fixtures.org.id,
    });
  });

  // todo: failing to install slack app

  describe('unathenticated user', () => {
    test('is prompted to authenticate before subscribing', async () => {
      const { probot } = helper;

      // User installs slack app
      nock('https://slack.com').post('/api/oauth.access')
        .reply(200, fixtures.slack.oauth());

      await request(probot.server).get('/slack/oauth/callback')
        .query({ code: 'test' })
        .expect(302); // .expect('Location', 'https://slack.com/app_redirect?app=123&team=456');

      // User types slash command
      const command = fixtures.slack.command({
        text: 'subscribe https://github.com/atom/atom',
      });
      const req = request(probot.server).post('/slack/command').send(command);
      const res = await req.expect(200);

      // User is shown ephemeral prompt to authenticate
      const prompt = /^<https:\/\/example\.com(\/github\/oauth\/login\?state=(.*))\|Finish linking your account>$/;
      const text = res.body.attachments[0].text;
      expect(text).toMatch(prompt);

      // User follows link to OAuth
      const [, link, state] = text.match(prompt);
      const loginRequest = request(probot.server).get(link);
      await loginRequest.expect(302).expect('Location',
        `https://github.com/login/oauth/authorize?client_id=&state=${state}`,
      );

      // GitHub redirects back, authenticates user and process subscription
      nock('https://github.com').post('/login/oauth/access_token')
        .reply(200, fixtures.github.oauth);
      nock('https://api.github.com').get('/user')
        .reply(200, fixtures.user);
      const linkConfirmation = nock('https://hooks.slack.com').post('/commands/1234/5678', {
        response_type: 'ephemeral',
        attachments: [{
          text: `:white_check_mark: Success! <@${command.user_id}> is now linked to <${fixtures.user.html_url}|@${fixtures.user.login}>`,
        }],
      }).reply(200);

      await request(probot.server).get('/github/oauth/callback').query({ state })
        .expect(302).expect('Location',
          `slack://channel?team=${command.team_id}&channel=${command.channel_id}`,
        );

      expect(linkConfirmation.isDone()).toBe(true);
    });
  });

  // unauthenticated user
    // subscribe to repo they have access to
    // subscribe to repo they don't have access to

  // authenticaed
    // app is not installed

  test('successfully subscribing to a repository', async () => {
    const { probot } = helper;

    const requests = {
      account: nock('https://api.github.com').get('/orgs/atom').reply(200, fixtures.org),
      repo: nock('https://api.github.com').get('/repos/atom/atom').reply(200, fixtures.repo),
    };

    const command = fixtures.slack.command({
      text: 'subscribe https://github.com/atom/atom',
    });

    const req = request(probot.server).post('/slack/command').send(command);

    await req.expect(200).expect((res) => {
      expect(res.body).toMatchSnapshot();
    });

    expect(requests.account.isDone()).toBe(true);
    expect(requests.repo.isDone()).toBe(true);
  });

  test('subsscribing with a bad url', async () => {
    const { probot } = helper;

    const command = fixtures.slack.command({ text: 'subscribe wat?' });

    const req = request(probot.server).post('/slack/command').send(command);

    await req.expect(200).expect((res) => {
      expect(res.body).toMatchSnapshot();
    });
  });
});
