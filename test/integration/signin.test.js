const request = require('supertest');
const nock = require('nock');

const helper = require('.');
const fixtures = require('../fixtures');

const { probot } = helper;

describe('Integration: signin', () => {
  beforeEach(async () => {
    const { SlackWorkspace } = helper.robot.models;

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
      const req = request(probot.server).post('/slack/command').send(command);
      const res = await req.expect(200);

      // User is shown ephemeral prompt to authenticate
      const promptUrl = /^https:\/\/example\.com(\/github\/oauth\/login\?state=(.*))/;
      const { text } = res.body.attachments[0].actions[0];
      const { url } = res.body.attachments[0].actions[0];
      expect(text).toMatch('Connect GitHub account');
      expect(url).toMatch(promptUrl);

      // User follows link to OAuth
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
          `slack://channel?team=${command.team_id}&channel=${command.channel_id}`,
        );
    });
  });
});
