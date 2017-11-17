process.env.SLACK_VERIFICATION_TOKEN = 'test';

const request = require('supertest');
const createProbot = require('probot');
const nock = require('nock');

const slack = require('../../../lib/slack');

const repoFixture = require('../../fixtures/repo');
let commandFixture = require('../../fixtures/slack/command.subscribe');

describe('commands', () => {
  let probot;

  beforeEach(() => {
    nock.enableNetConnect(/127\.0\.0\.1/);

    probot = createProbot({});
    probot.load(slack);
  });

  describe('/github subscribe https://github.com/owner/repo', () => {
    test('confirms the subscription', async () => {
      const scope = nock('https://api.github.com').get('/repos/atom/atom')
        .reply(200, repoFixture);

      const req = request(probot.server).post('/slack/command').send(commandFixture);

      await req.expect(200).expect((res) => {
        expect(res.body).toMatchSnapshot();
      });

      expect(scope.isDone()).toBe(true);
    });
  });

  describe('/github subscribe wat?', () => {
    test('shows an error', async () => {
      commandFixture = { ...commandFixture, text: 'subscribe wat?' };

      const req = request(probot.server).post('/slack/command').send(commandFixture);

      await req.expect(200).expect((res) => {
        expect(res.body).toMatchSnapshot();
      });
    });
  });
});
