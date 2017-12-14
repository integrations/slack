const request = require('supertest');

const helper = require('.');
const fixtures = require('../fixtures');

const { probot } = helper;

describe('Integration: help', () => {
  test('returns help with no arguments', async () => {
    const command = fixtures.slack.command({ text: '' });
    await request(probot.server).post('/slack/command').send(command)
      .expect(200)
      .then((res) => {
        expect(res.body).toMatchSnapshot();
      });
  });

  test('returns help with /github help command', async () => {
    const command = fixtures.slack.command({ text: 'help' });
    await request(probot.server).post('/slack/command').send(command)
      .expect(200)
      .then((res) => {
        expect(res.body).toMatchSnapshot();
      });
  });

  test('returns help with unknown command', async () => {
    const command = fixtures.slack.command({ text: 'lolwut?' });
    await request(probot.server).post('/slack/command').send(command)
      .expect(200)
      .then((res) => {
        expect(res.body).toMatchSnapshot();
      });
  });
});
