process.env.SLACK_VERIFICATION_TOKEN = 'test';

const request = require('supertest');
const createProbot = require('probot');
const command = require('../../fixtures/slack/command.subscribe');

describe('commands', () => {
  let probot;

  beforeEach(() => {
    probot = createProbot({});
  });

  describe('/github subscribe https://github.com/owner/repo', () => {
    test('status 200', () => request(probot.server).post('/slack/command')
        .send(command)
        .expect(200, 'OK'));
  });
});
