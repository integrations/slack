const request = require('supertest');

const fixtures = require('../fixtures');

const { probot, slackbot } = require('.');

describe('Error handling', () => {
  beforeEach(() => {
    // silence logger for this test
    probot.logger.level('fatal');
  });

  test('/boom returns 500', async () => {
    await request(probot.server).get('/boom').expect(500);
  });

  test('/boom?async returns 500', async () => {
    await request(probot.server).get('/boom').query({ async: true }).expect(500);
  });

  test('response to failed slack commands', async () => {
    const command = fixtures.slack.command({
      text: 'boom',
    });

    await request(probot.server).post('/slack/command').use(slackbot)
      .send(command)
      .expect(200, /ephemeral/);
  });
});
