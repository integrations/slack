const supertest = require('supertest');
const nock = require('nock');
const queryString = require('query-string');

const { probot, models } = require('.');

const { SlackWorkspace } = models;

const fixtures = require('../fixtures');

const { access } = fixtures.slack.oauth.v2;

const request = supertest.agent(probot.server);

describe('Integration: slack authentication', () => {
  afterEach(() => {
    delete process.env.SLACK_ENTERPRISE_ID;
  });

  test('/login', async () => {
    nock('https://slack.com').post('/api/chat.postMessage', (body) => {
      expect(body).toMatchSnapshot();
      return true;
    }).reply(200, { ok: true });
    const res = await request.get('/slack/oauth/login')
      .expect(302);

    const { location } = res.headers;
    const pattern = /^https:\/\/slack\.com\/oauth\/v2\/authorize\?client_id=(?:.*)&scope=(?:.*)&state=(?:.*)$/;
    expect(location).toMatch(pattern);

    const code = 'code-from-slack';
    const { state } = queryString.parse(location.replace('https://slack.com/oauth/authorize', ''));

    nock('https://slack.com').post('/api/oauth.v2.access').reply(200, access);

    await request.get('/slack/oauth/callback').query({ code, state })
      .expect(302)
      .expect('Location', `https://slack.com/app_redirect?app=${access.app_id}&team=${access.team.id}`);

    const workspace = await SlackWorkspace.findOne({ where: { slackId: access.team.id } });
    expect(workspace.accessToken).toEqual(access.access_token);
  });

  test('updates the access token', async () => {
    nock('https://slack.com').post('/api/chat.postMessage', (body) => {
      expect(body).toMatchSnapshot();
      return true;
    }).reply(200, { ok: true });

    const workspace = await SlackWorkspace.create({ slackId: access.team.id, accessToken: 'old' });

    const res = await request.get('/slack/oauth/login')
      .expect(302);
    const { location } = res.headers;
    const { state } = queryString.parse(location.replace('https://slack.com/oauth/v2/authorize', ''));
    const code = 'code-from-slack';

    nock('https://slack.com').post('/api/oauth.v2.access').reply(200, access);

    await request.get('/slack/oauth/callback')
      .query({ code, state })
      .expect(302);

    await workspace.reload();

    expect(workspace.accessToken).not.toEqual('old');
    expect(workspace.accessToken).toEqual(access.access_token);
  });

  test('allows all teams', async () => {
    nock('https://slack.com').post('/api/chat.postMessage', (body) => {
      expect(body).toMatchSnapshot();
      return true;
    }).reply(200, { ok: true });

    nock('https://slack.com').post('/api/oauth.v2.access').reply(200, access);

    const res = await request.get('/slack/oauth/login')
      .expect(302);
    const { location } = res.headers;
    const { state } = queryString.parse(location.replace('https://slack.com/oauth/v2/authorize', ''));
    const code = 'code-from-slack';

    await request.get('/slack/oauth/callback')
      .query({ code, state })
      .expect(302)
      .expect('Location', `https://slack.com/app_redirect?app=${access.app_id}&team=${access.team.id}`);
  });

  test('prevents non-enterprise teams when SLACK_ENTERPRISE_ID is set', async () => {
    process.env.SLACK_ENTERPRISE_ID = 'E00';

    nock('https://slack.com').post('/api/oauth.v2.access').reply(200, access);

    const res = await request.get('/slack/oauth/login').expect(302);
    const { location } = res.headers;
    const { state } = queryString.parse(location.replace('https://slack.com/oauth/v2/authorize', ''));
    const code = 'code-from-slack';

    await request.get('/slack/oauth/callback')
      .query({ code, state })
      .expect(302)
      .expect('Location', '/slack/oauth/login');
  });

  test('user aborting oauth process redirects to restart OAuth flow', async () => {
    await request.get('/slack/oauth/callback').query({ error: 'access_denied' })
      .expect(302)
      .expect('Location', '/slack/oauth/login');
  });

  test('no state param redirects to restart OAuth flow', async () => {
    await request.get('/slack/oauth/callback').query({ code: 'abc' })
      .expect(302)
      .expect('Location', '/slack/oauth/login');
  });

  test('no session redirects to restart OAuth flow', async () => {
    await supertest(probot.server).get('/slack/oauth/callback').query({ code: 'abc', state: 'def' })
      .expect(302)
      .expect('Location', '/slack/oauth/login');
  });

  test('invalid state redirects to restart OAuth flow', async () => {
    await request.get('/slack/oauth/login')
      .expect(302);
    const code = 'code-from-slack';
    await request.get('/slack/oauth/callback').query({ code, state: 'not-the-same' })
      .expect(302)
      .expect('Location', '/slack/oauth/login');
  });

  test('slack non-ok response redirects to restart OAuth flow', async () => {
    // silence logger for this test
    probot.logger.level('fatal');

    const res = await request.get('/slack/oauth/login')
      .expect(302);
    const { location } = res.headers;
    const { state } = queryString.parse(location.replace('https://slack.com/oauth/authorize', ''));
    const code = 'code-from-slack';

    nock('https://slack.com').post('/api/oauth.v2.access').reply(200, { ok: false, error: 'test_error' });

    await request.get('/slack/oauth/callback').query({ code, state })
      .expect(302)
      .expect('Location', '/slack/oauth/login');
  });
});
