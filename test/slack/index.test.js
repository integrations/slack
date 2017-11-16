process.env.SLACK_VERIFICATION_TOKEN = 'secret';
const nock = require('nock');
const createRobot = require('probot');
const request = require('supertest');

const slack = require('../../lib/slack');
const linkSharedOne = require('../fixtures/unfurls/links_shared_one.json');

describe('end to end unfurls', () => {
  let probot;

  beforeEach(() => {
    probot = createRobot({});
    probot.load(slack);
  });
  describe('https://github.com/bkeepers/dotenv', () => {
    test('works', () => {
      nock.back('repo/bkeepers-dotenv.json', (nockDone) => {
        const req = request(probot.server)
          .post('/slack/events')
          .send(linkSharedOne);

        // unfurl in Slack
        nock('https://slack.com')
          .post('/api/chat.unfurl');

        req.expect(200).then(nockDone);
      });
    });
  });
});
