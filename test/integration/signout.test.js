const request = require('supertest');
const nock = require('nock');

const { probot, slackbot, models } = require('.');
const fixtures = require('../fixtures');

const promptUrl = /^http:\/\/127\.0\.0\.1:\d+(\/github\/oauth\/login\?state=(.*))/;

const {
  SlackWorkspace,
  GitHubUser,
  SlackUser,
  Installation,
  Subscription,
} = models;

describe('Integration: signout', async () => {
  let workspace;
  let githubUser;
  let slackUser;
  beforeEach(async () => {
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
    });

    const installation1 = await Installation.create({
      githubId: 1,
      ownerId: 1,
    });

    const installation2 = await Installation.create({
      githubId: 2,
      ownerId: 2,
    });

    await Subscription.subscribe({
      channelId: 'C2147483705',
      githubId: 1,
      installationId: installation1.id,
      slackWorkspaceId: workspace.id,
      creatorId: slackUser.id,
    });

    await Subscription.subscribe({
      channelId: 'C2147483705',
      githubId: 2,
      installationId: installation2.id,
      slackWorkspaceId: workspace.id,
      creatorId: slackUser.id,
    });

    await Subscription.subscribe({
      channelId: 'C12345',
      githubId: 3,
      installationId: installation2.id,
      slackWorkspaceId: workspace.id,
      creatorId: slackUser.id,
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

    nock('https://hooks.slack.com').post('/commands/1234/5678', (body) => {
      expect(body).toMatchSnapshot();
      return true;
    }).reply(200);

    await request(probot.server).get('/github/oauth/callback').query({ state })
      .expect(302)
      .expect(
        'Location',
        `https://slack.com/app_redirect?team=${command.team_id}&channel=${command.channel_id}`,
      );
  });

  test('a signed in user is successfully signed out and relevant subscriptions are deleted', async () => {
    await slackUser.update({
      githubId: githubUser.id,
    });
    nock('https://api.github.com').get('/repositories/1').reply(200, {
      full_name: 'atom/atom',
    });

    nock('https://api.github.com').get('/repositories/2').reply(200, {
      full_name: 'kubernetes/kubernetes',
    });

    nock('https://api.github.com').get('/repositories/3').reply(200, {
      full_name: 'integrations/slack',
    });

    nock('https://slack.com').post('/api/chat.postMessage', (body) => {
      expect(body).toMatchSnapshot();
      return true;
    }).times(2).reply(200, { ok: true });

    const command = fixtures.slack.command({
      text: 'signout',
    });

    const res = await request(probot.server).post('/slack/command').send(command).expect(200);
    expect(res.body.attachments[0].text).toMatchSnapshot();

    expect((await slackUser.reload()).githubId).toBe(null);
    expect((await Subscription.findAll({ where: { creatorId: slackUser.id } })).length).toBe(0);
  });
});
