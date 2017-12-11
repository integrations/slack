const request = require('supertest');
const nock = require('nock');

const helper = require('.');
const fixtures = require('../fixtures');

const { probot } = helper;

describe('Integration: signin', () => {
  describe('unauthenticated user', () => {
    test('is prompted to authenticate', async () => {
      // User types slash command
      const command = fixtures.slack.command({
        text: 'signin',
      });
      const req = request(probot.server).post('/slack/command').send(command);
      const res = await req.expect(200);

      // User is shown ephemeral prompt to authenticate
      const prompt = /^<https:\/\/example\.com(\/github\/oauth\/login\?state=(.*))\|Finish connecting your GitHub account>$/;
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

      nock('https://hooks.slack.com').post('/commands/1234/5678', {
        response_type: 'ephemeral',
        attachments: [{
          text: `:white_check_mark: Success! <@${command.user_id}> is now connected to <${fixtures.user.html_url}|@${fixtures.user.login}>`,
        }],
      }).reply(200);

      await request(probot.server).get('/github/oauth/callback').query({ state })
        .expect(302)
        .expect('Location',
          `slack://channel?team=${command.team_id}&channel=${command.channel_id}`,
        );
    });
  });
});
