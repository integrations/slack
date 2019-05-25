const request = require('supertest');

const { probot } = require('.');

describe('Slack events', () => {
  describe('POST /slack/events.url_verification', () => {
    test('responds with challenge if token matches', async () => {
      await request(probot.server).post('/slack/events')
        .send({
          token: process.env.SLACK_VERIFICATION_TOKEN,
          challenge: 'abc-123',
          type: 'url_verification',
        })
        .expect(200, 'abc-123');
    });

    test('responds with 400 if token is invalid', async () => {
      await request(probot.server).post('/slack/events')
        .send({
          token: 'wrong-togken',
          challenge: 'abc-123',
          type: 'url_verification',
        })
        .expect(400);
    });

    test('responds with 400 when POSTed to directly', async () => {
      await request(probot.server).post('/slack/events.config_migration')
        .send({})
        .expect(400)
        .expect('Invalid verificaton token');
    });
  });
});
