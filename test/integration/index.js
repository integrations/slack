const createProbot = require('probot');
const GitHub = require('probot/lib/github');
const logger = require('../../lib/logger');
const nock = require('nock');

const slackbot = require('../slackbot');
const app = require('../../lib');
const models = require('../../lib/models');

const cache = require('../../lib/cache');

const probot = createProbot({});
const robot = probot.load(app);

// raise errors in tests
robot.catchErrors = false;

// Expect there are no more pending nock requests
beforeEach(async () => nock.cleanAll());
afterEach(() => expect(nock.pendingMocks()).toEqual([]));

// Ensure there is a connection established
beforeAll(async () => models.sequelize.authenticate());
// Close connection when tests are done
afterAll(async () => models.sequelize.close());

beforeEach(() => {
  // Restore log level after each test
  probot.logger.level(process.env.LOG_LEVEL);

  // FIXME: Upstream probot needs an easier way to mock this out.
  robot.auth = jest.fn().mockReturnValue(Promise.resolve(new GitHub({ logger })));

  // Clear all data out of the test database
  return Promise.all([
    models.sequelize.truncate({ cascade: true }),
    cache.clear(),
  ]);
});

module.exports = {
  robot, probot, app, slackbot, models,
};
