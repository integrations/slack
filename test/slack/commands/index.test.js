process.env.SLACK_VERIFICATION_TOKEN = 'test';

const request = require('supertest');
const createProbot = require('probot');
const nock = require('nock');

const slack = require('../../../lib/slack');

const repoFixture = require('../../fixtures/repo');
const commandFixture = require('../../fixtures/slack/command.subscribe');

describe('commands', () => {
  let probot;

  beforeEach(() => {
    probot = createProbot({});
    probot.load(slack);
  });

  describe('/github subscribe https://github.com/owner/repo', () => {
    test('confirms the subscription', async () => {
      const scope = nock('https://api.github.com').get('/repos/atom/atom')
        .reply(200, repoFixture);

      const req = request(probot.server).post('/slack/command').send(commandFixture);

      await req.expect(200, {
        response_type: 'in_channel',
        text: 'Subscribed <#C2147483705> to <https://github.com/bkeepers/dotenv|bkeepers/dotenv>',
      });

      expect(scope.isDone()).toBe(true);
    });
  });
});
