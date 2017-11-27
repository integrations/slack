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

  describe.only('unathenticated user', () => {
    test('subscribing to a repo they do not have access to', async () => {
      const { probot } = helper;

      // User installs slack app
      // TODO!

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

      // GitHub redirects back
      const accessTokenRequest = nock('https://github.com').post('/login/oauth/access_token')
        .reply(200, fixtures.github.oauth);
      const userRequest = nock('https://api.github.com').get('/user')
        .reply(200, fixtures.user);
      const oauthCallback = request(probot.server).get('/github/oauth/callback')
        .query({ state });
      await oauthCallback.expect(302).expect('Location',
        `slack://channel?team=${command.team_id}&channel=${command.channel_id}`,
      );
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
