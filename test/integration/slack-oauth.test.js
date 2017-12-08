const request = require('supertest');
const nock = require('nock');

const helper = require('.');

const { probot } = helper;

const access = require('../fixtures/slack/oauth.token');

describe('Integration: slack authentication', () => {
  test('/login', async () => {
    const res = await request(probot.server).get('/slack/oauth/login')
      .expect(302);

    const location = res.headers.location;
    const pattern = /^https:\/\/slack\.com\/oauth\/authorize\?client_id=(?:.*)&state=(.*)&scope=(?:.*)$/;
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
});
