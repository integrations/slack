const request = require('supertest');

const { probot } = require('.');

describe('Integration', () => {
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
});
