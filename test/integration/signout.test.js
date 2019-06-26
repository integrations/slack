const supertest = require('supertest');
const nock = require('nock');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');

const { probot, slackbot, models } = require('.');
const fixtures = require('../fixtures');

const verify = promisify(jwt.verify);

const request = supertest.agent(probot.server);

const promptUrl = /^http:\/\/127\.0\.0\.1:\d+(\/github\/oauth\/login\?state=(.*))/;
const continueLinkPattern = /<a href="https:\/\/github\.com\/login\/oauth\/authorize\?client_id.*(?<!\.)(ey.*)" class.*<\/a>/;

const {
  SlackWorkspace,
  GitHubUser,
  SlackUser,
  Installation,
  Subscription,
  DeletedSubscription,
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
      type: 'repo',
    });

    await Subscription.subscribe({
      channelId: 'C2147483705',
      githubId: 2,
      installationId: installation2.id,
      slackWorkspaceId: workspace.id,
      creatorId: slackUser.id,
      type: 'repo',
    });

    await Subscription.subscribe({
      channelId: 'C12345',
      githubId: 3,
      installationId: installation2.id,
      slackWorkspaceId: workspace.id,
      creatorId: slackUser.id,
      type: 'account',
    });
  });
  test('a signed out user is prompted to sign in first', async () => {
    const command = fixtures.slack.command({
      text: 'signout',
    });
    const res = await request.post('/slack/command')
      .use(slackbot)
      .send(command)
      .expect(200);

    const { url } = res.body.attachments[0].actions[0];
    const [, link] = url.match(promptUrl);

    const interstitialRes = await request.get(link);
    expect(interstitialRes.status).toBe(200);
    expect(interstitialRes.text).toMatch(/Connect GitHub account/);
    expect(interstitialRes.text).toMatch(/example\.slack\.com/);
    expect(Object.keys(interstitialRes.headers)).toContain('set-cookie');
    expect(interstitialRes.headers['set-cookie'][0]).toMatch(/session=/);

    const state = continueLinkPattern.exec(interstitialRes.text)[1];

    expect(await verify(state, process.env.GITHUB_CLIENT_SECRET)).toMatchInlineSnapshot(
      {
        githubOAuthState: expect.any(String),
        iat: expect.any(Number),
        exp: expect.any(Number),
      },
      `
Object {
  "channelSlackId": "C2147483705",
  "exp": Any<Number>,
  "githubOAuthState": Any<String>,
  "iat": Any<Number>,
  "replaySlashCommand": false,
  "teamSlackId": "T0001",
  "trigger_id": "13345224609.738474920.8088930838d88f008e0",
  "userSlackId": "U2147483697",
}
`,
    );

    // GitHub redirects back, authenticates user and process subscription
    nock('https://github.com').post('/login/oauth/access_token')
      .reply(200, fixtures.github.oauth);
    nock('https://api.github.com').get('/user')
      .reply(200, fixtures.user);

    nock('https://slack.com').post('/api/chat.postEphemeral', (body) => {
      expect(body.user).toBe('U2147483697');
      expect(body.channel).toBe('C2147483705');
      expect(JSON.parse(body.attachments)).toMatchSnapshot();
      return true;
    }).reply(200, { ok: true });

    await request.get('/github/oauth/callback').query({ state })
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

    nock('https://api.github.com').get('/user/3').reply(200, {
      login: 'github',
    });

    nock('https://slack.com').post('/api/chat.postMessage', (body) => {
      expect(body).toMatchInlineSnapshot(`
Object {
  "attachments": "[{\\"color\\":\\"#24292f\\",\\"mrkdwn_in\\":[\\"text\\"],\\"text\\":\\"Subscriptions to 2 repositories have been disabled because <@U2147483697>, who originally set them up, has disconnected their GitHub account.\\\\nUse the following slash commands to re-enable the subscriptions:\\\\n/github subscribe atom/atom\\\\n/github subscribe kubernetes/kubernetes\\"}]",
  "channel": "C2147483705",
  "token": "xoxp-token",
}
`);
      return true;
    })
      .reply(200, { ok: true });

    nock('https://slack.com')
      .post('/api/chat.postMessage', (body) => {
        expect(body).toMatchInlineSnapshot(`
Object {
  "attachments": "[{\\"color\\":\\"#24292f\\",\\"mrkdwn_in\\":[\\"text\\"],\\"text\\":\\"The subscription to 1 account has been disabled because <@U2147483697>, who originally set it up, has disconnected their GitHub account.\\\\nUse the following slash command to re-enable the subscription:\\\\n/github subscribe github\\"}]",
  "channel": "C12345",
  "token": "xoxp-token",
}
`);
        return true;
      })
      .reply(200, { ok: true });

    const command = fixtures.slack.command({
      text: 'signout',
    });

    const res = await request.post('/slack/command').send(command).expect(200);
    expect(res.body.attachments[0].text).toMatchSnapshot();

    expect((await slackUser.reload()).githubId).toBe(null);
    expect((await Subscription.findAll({ where: { creatorId: slackUser.id } })).length).toBe(0);
    expect((await DeletedSubscription.findAll({
      where: {
        creatorId: slackUser.id,
        reason: 'signout',
      },
    })).length).toBe(3);
  });
});
