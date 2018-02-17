const request = require('supertest');

const fixtures = require('../fixtures');

const { probot } = require('.');

describe('Error handling', () => {
  test('/boom returns 500', async () => {
    // silence logger for this test
    probot.logger.level('fatal');
    await request(probot.server).get('/boom').expect(500);
  });

  test('/boom?async returns 500', async () => {
    // silence logger for this test
    probot.logger.level('fatal');
    await request(probot.server).get('/boom').query({ async: true }).expect(500);
  });

  test('response to failed slack commands', async () => {
    const command = fixtures.slack.command({
      text: 'boom',
    });

    await request(probot.server).post('/slack/command')
      // https://api.slack.com/robots
      .set('User-Agent', 'Slackbot 1.0 (+https://api.slack.com/robots)')
      .send(command)
      .expect(200, /ephemeral/);
  });
});
