const supertest = require('supertest');
const nock = require('nock');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');

const sign = promisify(jwt.sign);
const verify = promisify(jwt.verify);
const { probot, slackbot, models } = require('.');
const fixtures = require('../fixtures');
const cache = require('../../lib/cache');

const { SlackWorkspace, GitHubUser } = models;

const request = supertest.agent(probot.server);

const promptUrl = /^http:\/\/127\.0\.0\.1:\d+(\/github\/oauth\/login\?state=(.*))/;
const continueLinkPattern = /<a href="https:\/\/github\.com\/login\/oauth\/authorize\?client_id.*(?<!\.)(ey.*)" class.*<\/a>/;

describe('Integration: signin', () => {
  beforeEach(async () => {
    // create workspace
    await SlackWorkspace.create({
      slackId: 'T0001',
      accessToken: 'xoxp-token',
    });
  });

  describe('unauthenticated user', () => {
    test('is prompted to authenticate', async () => {
      // User types slash command
      const command = fixtures.slack.command({
        text: 'signin',
      });
      const res = await request.post('/slack/command')
        .use(slackbot)
        .send(command)
        .expect(200);

      // User is shown ephemeral prompt to authenticate
      const { text, url } = res.body.attachments[0].actions[0];
      expect(text).toMatch('Connect GitHub account');
      expect(url).toMatch(promptUrl);

      // User follows link to OAuth
      const [, link] = url.match(promptUrl);

      const interstitialRes = await request.get(link);
      expect(interstitialRes.status).toBe(200);
      expect(interstitialRes.text).toMatch(/Connect GitHub account/);
      expect(interstitialRes.text).toMatch(/example\.slack\.com/);
      expect(Object.keys(interstitialRes.headers)).toContain('set-cookie');
      expect(interstitialRes.headers['set-cookie'][0]).toMatch(/session=/);

      const state = continueLinkPattern.exec(interstitialRes.text)[1];

      expect(await verify(state, process.env.GITHUB_CLIENT_SECRET)).toMatchSnapshot({
        githubOAuthState: expect.any(String),
        iat: expect.any(Number),
        exp: expect.any(Number),
      });

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

      const users = await GitHubUser.findAll();
      expect(users).toHaveLength(1);
      expect(users[0].dataValues).toMatchSnapshot({
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        secrets: expect.any(Object),
      });
    });

    test.each([
      ['subscribe kubernetes'],
      ['unsubscribe kubernetes'],
      ['subscribe kubernetes/kubernetes'],
      ['unsubscribe kubernetes/kubernetes'],
      ['close https://github.com/owner/repo/issues/123'],
      ['reopen https://github.com/owner/repo/issues/123'],
    ])('is prompted to authenticate for slash command "%s"', async (commandText) => {
      // User types slash command
      const command = fixtures.slack.command({
        text: commandText,
      });
      const res = await request.post('/slack/command')
        .use(slackbot)
        .send(command)
        .expect(200);

      // User is shown ephemeral prompt to authenticate
      const { text, url } = res.body.attachments[0].actions[0];
      expect(text).toMatch('Connect GitHub account');
      expect(url).toMatch(promptUrl);

      // User follows link to OAuth
      const [, link] = url.match(promptUrl);

      const interstitialRes = await request.get(link);
      expect(interstitialRes.status).toBe(200);
      expect(interstitialRes.text).toMatch(/Connect GitHub account/);
      expect(interstitialRes.text).toMatch(/example\.slack\.com/);
      expect(Object.keys(interstitialRes.headers)).toContain('set-cookie');
      expect(interstitialRes.headers['set-cookie'][0]).toMatch(/session=/);

      const state = continueLinkPattern.exec(interstitialRes.text)[1];

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
          '/slack/command?trigger_id=13345224609.738474920.8088930838d88f008e0',
        );
    });

    test('with invalid state cannot sign in', async () => {
      await request.get('/github/oauth/callback').query({ state: 'i-am-not-valid' })
        .expect(400)
        .expect('Error: jwt malformed');
    });

    test('without state paramter cannot sign in', async () => {
      await request.get('/github/oauth/callback')
        .expect(400)
        .expect('Error: State parameter was not provided');
    });

    test('with tampered state cannot sign in', async () => {
      const fakeSecret = `${process.env.GITHUB_CLIENT_SECRET}-fake`;
      const payload = {
        teamSlackId: 'T01234',
        userSlackId: 'U01234',
        channelSlackId: 'C01234',
      };
      const tamperedState = await sign(payload, fakeSecret, { expiresIn: '1h' });

      await request.get('/github/oauth/callback').query({ state: tamperedState })
        .expect(400)
        .expect('Error: invalid signature');
    });

    test('with expired state cannot sign in', async () => {
      const command = fixtures.slack.command({
        text: 'signin',
      });
      const res = await request.post('/slack/command')
        .use(slackbot)
        .send(command)
        .expect(200);

      // User is shown ephemeral prompt to authenticate
      const { text, url } = res.body.attachments[0].actions[0];
      expect(text).toMatch('Connect GitHub account');
      expect(url).toMatch(promptUrl);

      // User follows link to OAuth
      const [, link] = url.match(promptUrl);

      const interstitialRes = await request.get(link);
      expect(interstitialRes.status).toBe(200);

      const state = continueLinkPattern.exec(interstitialRes.text)[1];

      // Set date to current date + 2 hours
      const now = new Date();
      const dateSpy = jest.spyOn(Date, 'now').mockImplementation(() => now.setHours(now.getHours() + 2));

      await request.get('/github/oauth/callback').query({ state })
        .expect(400)
        .expect('Error: jwt expired');

      // Reset date
      dateSpy.mockRestore();
    });

    // With invalid state cookie cannot sign in
    test('witout state cookie cannot complete sign in process', async () => {
      const command = fixtures.slack.command({
        text: 'signin',
      });
      const res = await request.post('/slack/command')
        .use(slackbot)
        .send(command)
        .expect(200);

      // User is shown ephemeral prompt to authenticate
      const { text, url } = res.body.attachments[0].actions[0];
      expect(text).toMatch('Connect GitHub account');
      expect(url).toMatch(promptUrl);

      // User follows link to OAuth
      const [, link] = url.match(promptUrl);

      const interstitialRes = await request.get(link);

      const state = continueLinkPattern.exec(interstitialRes.text)[1];

      // Use fresh client instead of supertest agent
      await supertest(probot.server).get('/github/oauth/callback').query({ state })
        .expect(400)
        .expect('Error: No OAuth state cookie set');

      const users = await GitHubUser.findAll();
      expect(users).toHaveLength(0);
    });

    test('with state mismatch cannot complete sign in process', async () => {
      const command = fixtures.slack.command({
        text: 'signin',
      });
      const res = await request.post('/slack/command')
        .use(slackbot)
        .send(command)
        .expect(200);

      const { text, url } = res.body.attachments[0].actions[0];
      expect(text).toMatch('Connect GitHub account');
      expect(url).toMatch(promptUrl);
      const [, link] = url.match(promptUrl);

      const interstitialRes = await request.get(link);

      const state = continueLinkPattern.exec(interstitialRes.text)[1];

      // Start new sign in process to acquire new state cookie
      const newSignInRes = await request.post('/slack/command')
        .use(slackbot)
        .send(command)
        .expect(200);

      const [, newSignInLink] = newSignInRes.body.attachments[0].actions[0].url.match(promptUrl);

      // Acquire new state cookie
      await request.get(newSignInLink);

      await request.get('/github/oauth/callback').query({ state })
        .expect(400)
        .expect('Error: OAuth State mismatch, please try again.');

      const users = await GitHubUser.findAll();
      expect(users).toHaveLength(0);
    });

    test('is redirected to Slack directly if command cannot be replayed', async () => {
      const command = fixtures.slack.command({
        text: 'subscribe kubernetes/kubernetes',
      });
      const res = await request.post('/slack/command')
        .use(slackbot)
        .send(command)
        .expect(200);

      // User is shown ephemeral prompt to authenticate
      const { text, url } = res.body.attachments[0].actions[0];
      expect(text).toMatch('Connect GitHub account');
      expect(url).toMatch(promptUrl);

      // User follows link to OAuth
      const [, link] = url.match(promptUrl);

      const interstitialRes = await request.get(link);
      expect(interstitialRes.status).toBe(200);

      const state = continueLinkPattern.exec(interstitialRes.text)[1];

      // Clear cache to remove pending command that we have stored there now
      await cache.clear();

      // GitHub redirects back, authenticates user and process subscription
      nock('https://github.com').post('/login/oauth/access_token')
        .reply(200, fixtures.github.oauth);
      nock('https://api.github.com').get('/user')
        .reply(200, fixtures.user);

      nock('https://slack.com').post('/api/chat.postEphemeral', (body) => {
        expect(body.user).toBe('U2147483697');
        expect(body.channel).toBe('C2147483705');
        return true;
      }).reply(200, { ok: true });

      await request.get('/github/oauth/callback').query({ state })
        .expect(302)
        .expect(
          'Location',
          `https://slack.com/app_redirect?team=${command.team_id}&channel=${command.channel_id}`,
        );
    });
  });

  describe('with a pending subscription', () => {
    test('redirects to install app and creates subscription', async () => {
      // User types slash command
      const command = fixtures.slack.command({
        text: 'subscribe kubernetes/kubernetes',
      });
      // This will get called several times later
      const triggerUrl = `/slack/command?trigger_id=${command.trigger_id}`;

      let res = await request.post('/slack/command').use(slackbot).send(command)
        .expect(200);

      // User is shown ephemeral prompt to authenticate
      const { url } = res.body.attachments[0].actions[0];
      expect(url).toMatch(promptUrl);

      const [, link] = url.match(promptUrl);

      const interstitialRes = await request.get(link);
      expect(interstitialRes.status).toBe(200);

      const state = continueLinkPattern.exec(interstitialRes.text)[1];

      expect(await verify(state, process.env.GITHUB_CLIENT_SECRET)).toMatchSnapshot({
        githubOAuthState: expect.any(String),
        iat: expect.any(Number),
        exp: expect.any(Number),
      });

      // Pretend the user clicked the link, got redirected to GitHub and back
      nock('https://github.com').post('/login/oauth/access_token')
        .reply(200, fixtures.github.oauth);
      nock('https://api.github.com').get('/user')
        .reply(200, fixtures.user);

      // Post confirmation of signin
      nock('https://slack.com').post('/api/chat.postEphemeral', (body) => {
        expect(body.user).toBe('U2147483697');
        expect(body.channel).toBe('C2147483705');
        return true;
      }).reply(200, { ok: true });


      await request.get('/github/oauth/callback').query({ state })
        .expect(302)
        .expect('Location', triggerUrl);

      // Redirects to install the GitHub App
      nock('https://api.github.com').get('/repos/kubernetes/kubernetes/installation').reply(404);
      nock('https://api.github.com').get('/users/kubernetes').reply(200, fixtures.org);

      res = await request.get(triggerUrl)
        .expect(302)
        .expect('Location', /http:\/\/127\.0\.0\.1:\d+\/github\/install\/\d+\/.*/);

      const installLink = res.headers.location.replace(/http:\/\/127\.0\.0\.1:\d+/, '');

      nock('https://api.github.com').get('/app').reply(200, fixtures.app);

      await request.get(installLink)
        .expect(302)
        .expect('Location', 'https://github.com/apps/slack-bkeepers/installations/new');

      // Pretend the user goes and installs the GitHub app, and then is
      // redirected back to /setup.
      await request.get('/github/setup')
        .expect(302)
        .expect('Location', triggerUrl);

      nock('https://api.github.com').get('/repos/kubernetes/kubernetes/installation').reply(200, {
        id: 1,
        account: fixtures.repo.owner,
      });
      nock('https://api.github.com').get('/repos/kubernetes/kubernetes').reply(200, fixtures.repo);

      nock('https://hooks.slack.com').post('/commands/1234/5678', (body) => {
        expect(body).toMatchSnapshot();
        return true;
      }).reply(200);

      await request.get(triggerUrl)
        .expect(302)
        .expect('Location', 'https://slack.com/app_redirect?channel=C2147483705&team=T0001');
    });
  });

  describe('invalid state passed to /github/oauth/login', () => {
    test('no state supplied', async () => {
      await request.get('/github/oauth/login')
        .expect(400)
        .expect('Error: State parameter was not provided');
    });

    test('invalid JWT supplied', async () => {
      await request.get('/github/oauth/login').query({ state: 'i-am-not-valid' })
        .expect(400)
        .expect('Error: jwt malformed');
    });

    test('expired JWT supplied', async () => {
      const command = fixtures.slack.command({
        text: 'signin',
      });
      const res = await request.post('/slack/command')
        .use(slackbot)
        .send(command)
        .expect(200);

      // User is shown ephemeral prompt to authenticate
      const { text, url } = res.body.attachments[0].actions[0];
      expect(text).toMatch('Connect GitHub account');
      expect(url).toMatch(promptUrl);

      // User follows link to OAuth
      const [, link] = url.match(promptUrl);

      // Set date to current date + 2 hours
      const now = new Date();
      const dateSpy = jest.spyOn(Date, 'now').mockImplementation(() => now.setHours(now.getHours() + 2));

      const interstitialRes = await request.get(link);
      expect(interstitialRes.status).toBe(400);
      expect(interstitialRes.text).toBe('Error: The time window to connect your GitHub account has expired. Please return to Slack to re-start the process of connecting your GitHub account.');

      // Reset date
      dateSpy.mockRestore();
    });
  });
});
