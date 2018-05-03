const request = require('supertest');
const nock = require('nock');

const { probot, slackbot, models } = require('.');
const fixtures = require('../fixtures');

const promptUrl = /^http:\/\/127\.0\.0\.1:\d+(\/github\/oauth\/login\?state=(.*))/;

describe('Integration: signout', async () => {
  let workspace;
  let githubUser;
  let slackUser;
  beforeEach(async () => {
    const { SlackWorkspace, GitHubUser, SlackUser } = models;
    // create workspace
    workspace = await SlackWorkspace.create({
      slackId: 'T0001',
      accessToken: 'xoxp-token',
    });

    githubUser = await GitHubUser.create({
      id: 1,
      accessToken: 'secret',
    });

    slackUser = await SlackUser.create({
      slackId: 'U2147483697',
      slackWorkspaceId: workspace.id,
      githubId: githubUser.id,
    });
  });
  test('a signed out user is prompted to sign in first', async () => {
    const command = fixtures.slack.command({
      text: 'signout',
    });
    const res = await request(probot.server).post('/slack/command')
      .use(slackbot)
      .send(command)
      .expect(200);

    const { url } = res.body.attachments[0].actions[0];
    const [, link, state] = url.match(promptUrl);

    const loginRequest = request(probot.server).get(link);
    await loginRequest.expect(302).expect(
      'Location',
      `https://github.com/login/oauth/authorize?client_id=&state=${state}`,
    );

    // GitHub redirects back, authenticates user and process subscription
    nock('https://github.com').post('/login/oauth/access_token')
      .reply(200, fixtures.github.oauth);
    nock('https://api.github.com').get('/user')
      .reply(200, fixtures.user);

    nock('https://hooks.slack.com').post('/commands/1234/5678', {
      response_type: 'ephemeral',
      attachments: [{
        text: `:white_check_mark: Success! <@${command.user_id}> is now connected to <${fixtures.user.html_url}|@${fixtures.user.login}>`,
      }],
    }).reply(200);

    await request(probot.server).get('/github/oauth/callback').query({ state })
      .expect(302)
      .expect(
        'Location',
        `https://slack.com/app_redirect?team=${command.team_id}&channel=${command.channel_id}`,
      );
  });

  test('a signed in user is successfully signed out', async () => {
    const command = fixtures.slack.command({
      text: 'signout',
    });

    const res = await request(probot.server).post('/slack/command').send(command).expect(200);
    expect(res.body.attachments[0].text).toMatchSnapshot();

    expect((await slackUser.reload()).githubId).toBe(null);
  });
});
