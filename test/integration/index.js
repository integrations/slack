const createProbot = require('probot');
const GitHub = require('github');
const nock = require('nock');

const app = require('../..');

const storage = require('../../lib/storage');

const probot = createProbot({});
const robot = probot.load(app);

const { sequelize } = robot.models;

// Expect there are no more pending nock requests
beforeEach(async () => nock.cleanAll());
afterEach(() => expect(nock.pendingMocks()).toEqual([]));

 // Ensure there is a connection established
beforeAll(async () => sequelize.authenticate());
// Close connection when tests are done
afterAll(async () => sequelize.close());

beforeEach(() => {
  // FIXME: Upstream probot needs an easier way to mock this out.
  robot.auth = jest.fn().mockReturnValue(Promise.resolve(new GitHub()));

  // Clear all data out of the test database
  return Promise.all([
    sequelize.truncate({ cascade: true }),
    storage.clear(),
  ]);
});

module.exports = { robot, probot, app };
