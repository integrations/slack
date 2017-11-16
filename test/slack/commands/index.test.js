process.env.SLACK_VERIFICATION_TOKEN = 'test';

const request = require('supertest');
const createProbot = require('probot');
const nock = require('nock');

const slack = require('../../../lib/slack');
const command = require('../../fixtures/slack/command.subscribe');

describe('commands', () => {
  let probot;

  beforeEach(() => {
    probot = createProbot({});
    probot.load(slack);
  });

  describe('/github subscribe https://github.com/owner/repo', () => {
    test('status 200', (done) => {
      nock.back('repo/atom.json', (nockDone) => {
        const req = request(probot.server).post('/slack/command').send(command);

        req.expect(200, {
          response_type: 'in_channel',
          text: 'Subscribed <#C2147483705> to <https://github.com/atom/atom|atom/atom>',
        }).then(nockDone).then(done);
      });
    });
  });
});
