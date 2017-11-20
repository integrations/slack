process.env.SLACK_VERIFICATION_TOKEN = 'secret';
const nock = require('nock');
const createRobot = require('probot');
const request = require('supertest');

const slack = require('../../lib/slack');
const linkSharedOne = require('../fixtures/unfurls/links_shared_one.json');
const repoFixture = require('../fixtures/repo');

describe('end to end unfurls', () => {
  let probot;

  beforeEach(() => {
    probot = createRobot({});
    probot.load(slack);
  });
  test('https://github.com/bkeepers/dotenv', () => {
    const req = request(probot.server)
      .post('/slack/events')
      .send(linkSharedOne);

    const scope1 = nock('https://api.github.com').get('/repos/bkeepers/dotenv')
     .reply(200, repoFixture);

    // unfurl in Slack
    // const scope = nock('https://slack.com')
    //   .log(console.log)
    //   .post('/api/chat.unfurl')
    //   .reply(200, {});

    req.expect(200);
    if (!scope1.isDone()) {
      console.error('pending mocks: %j', scope1.pendingMocks());
    }
    expect(scope1.isDone()).toBe(true);
    // expect(scope.isDone()).toBe(true);
  });
});
