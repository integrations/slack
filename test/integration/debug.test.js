const request = require('supertest');

const helper = require('.');
const fixtures = require('../fixtures');

const { probot, slackbot } = helper;

describe('Integration: debug', () => {
  test('returns debug information', async () => {
    const command = fixtures.slack.command({ text: 'debug' });
    await request(probot.server).post('/slack/command').use(slackbot).send(command)
      .expect(200)
      .then((res) => {
        expect(res.body).toMatchSnapshot();
      });
  });
});
