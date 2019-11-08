const request = require('supertest');

const { probot } = require('.');

describe('Middleware', () => {
  test('Parse action payload returns 400 for invalid format', async () => {
    await request(probot.server).post('/slack/actions').send({
      team: 'T01234',
      callback_id: '1234',
    })
      .expect(400);
  });
});
