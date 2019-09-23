const request = require('supertest');

const { probot } = require('.');

describe('Slack options', () => {
  describe('responds with 400 when POSTed to directly', () => {
    test('invalid format', async () => {
      await request(probot.server).post('/slack/options:dialog_suggestion:add-comment:selectedUrl')
        .send({})
        .expect(400)
        .expect('Invalid format');
    });

    test('invalid verification token', async () => {
      await request(probot.server).post('/slack/options:dialog_suggestion:add-comment:selectedUrl')
        .send({
          payload: JSON.stringify({
            callback_id: 'something',
          }),
        })
        .expect(400)
        .expect('Invalid verificaton token');
    });
  });
});
