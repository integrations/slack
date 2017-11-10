process.env.SLACK_VERIFICATION_TOKEN = 'test';

const request = require('supertest');
const createProbot = require('probot');
const slack = require('../../../lib/slack');
const command = require('../../fixtures/slack/command.subscribe');

describe('commands', () => {
  let probot;

  beforeEach(() => {
    probot = createProbot({});
    probot.load(slack);
  });

  describe('/github subscribe https://github.com/owner/repo', () => {
    test('status 200', () => {
      request(probot.server).post('/slack/command')
        .send(command)
        .expect(200, {
          response_type: 'in_channel',
          text: 'subscribed <#C2147483705> to <https://github.com/atom/atom|atom/atom>',
        });
    });
  });
});
