const { createProbot } = require('probot');
const nock = require('nock');
const { GitHubAPI, ProbotOctokit } = require('../../lib/github/client');
const logger = require('../../lib/logger');

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
beforeAll(async () => {
  if (global.gc) {
    global.gc();
  }
  models.sequelize.authenticate();
});

// Close connection when tests are done
afterAll(async () => models.sequelize.close());

let setSpy;
let getSpy;
beforeEach(() => {
  getSpy = jest.spyOn(cache, 'get');
  setSpy = jest.spyOn(cache, 'set');

  // Restore log level after each test
  probot.logger.level(process.env.LOG_LEVEL);

  // FIXME: Upstream probot needs an easier way to mock this out.
  robot.auth = jest.fn().mockReturnValue(Promise.resolve(GitHubAPI({
    Octokit: ProbotOctokit,
    logger,
    retry: {
      // disable retries to test error states
      enabled: false,
    },
    throttle: {
      // disable throttling, otherwise tests are _slow_
      enabled: false,
    },
  })));

  // Clear all data out of the test database
  return Promise.all([
    models.sequelize.truncate({ cascade: true, restartIdentity: true }),
    cache.clear(),
  ]);
});

afterEach(() => {
  const getKeys = setSpy.mock.calls.reduce((keys, args) => {
    keys.add(args[0]);
    return keys;
  }, new Set());

  const cacheStatus = setSpy.mock.calls.reduce((status, args) => {
    status.set(args[0], args[1]);
    return status;
  }, new Map());

  // Only match snapshot if it's not an empty map or set
  if (getKeys.size > 0) {
    const sortedKeys = [...getKeys].sort();
    expect(sortedKeys).toMatchSnapshot();
  }
  if (cacheStatus.size > 0) {
    const sortedEntries = [...cacheStatus].sort((a, b) => (a[0] > b[0] ? 1 : -1));
    expect(sortedEntries).toMatchSnapshot();
  }

  getSpy.mockRestore();
  setSpy.mockRestore();
});

module.exports = {
  robot, probot, app, slackbot, models,
};
