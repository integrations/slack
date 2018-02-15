const request = require('supertest');
const nock = require('nock');

const helper = require('.');

const { probot } = helper;

const fixtures = require('../fixtures');

const access = fixtures.slack.oauth.token;

describe('Integration: slack authentication', () => {
  beforeEach(() => {
    delete process.env.ALLOWED_TEAMS;
  });

  test('/login', async () => {
    const res = await request(probot.server).get('/slack/oauth/login')
      .expect(302);

    const { location } = res.headers;
    const pattern = /^https:\/\/slack\.com\/oauth\/authorize\?client_id=(?:.*)&scope=(?:.*)$/;
    expect(location).toMatch(pattern);

    const code = 'code-from-slack';

    nock('https://slack.com').post('/api/oauth.token', {
      client_id: process.env.SLACK_CLIENT_ID,
      client_secret: process.env.SLACK_CLIENT_SECRET,
      code,
    }).reply(200, access);

    await request(probot.server).get('/slack/oauth/callback').query({ code })
      .expect(302)
      .expect('Location', `https://slack.com/app_redirect?app=${access.app_id}&team=${access.team_id}`);

    const { SlackWorkspace } = helper.robot.models;
    const workspace = await SlackWorkspace.findOne({ where: { slackId: access.team_id } });
    expect(workspace.accessToken).toEqual(access.access_token);
  });

  test('updates the access token', async () => {
    const { SlackWorkspace } = helper.robot.models;

    const workspace = await SlackWorkspace.create({ slackId: access.team_id, accessToken: 'old' });

    nock('https://slack.com').post('/api/oauth.token').reply(200, access);

    await request(probot.server).get('/slack/oauth/callback').expect(302);

    await workspace.reload();

    expect(workspace.accessToken).not.toEqual('old');
    expect(workspace.accessToken).toEqual(access.access_token);
  });

  test('denies teams that are not allowed', async () => {
    process.env.ALLOWED_TEAMS = 'not-your-team,not-your-team-either';

    nock('https://slack.com').post('/api/oauth.token').reply(200, access);
    nock('https://slack.com').post('/api/team.info').reply(200, fixtures.slack.team.info);
    nock('https://slack.com').post('/api/auth.revoke').reply(200, { ok: true });

    await request(probot.server).get('/slack/oauth/callback')
      .expect(302)
      .expect('Location', '/denied');
  });

  test('allows specified teams', async () => {
    process.env.ALLOWED_TEAMS = 'someone-else,example';

    nock('https://slack.com').post('/api/oauth.token').reply(200, access);
    nock('https://slack.com').post('/api/team.info').reply(200, fixtures.slack.team.info);

    await request(probot.server).get('/slack/oauth/callback')
      .expect(302)
      .expect('Location', `https://slack.com/app_redirect?app=${access.app_id}&team=${access.team_id}`);
  });
});
