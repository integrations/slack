const createProbot = require('probot');
const GitHub = require('github');
const app = require('../..');

const probot = createProbot({});
const robot = probot.load(app);

const { sequelize } = robot.models;

 // Ensure there is a connection established
beforeAll(async () => sequelize.authenticate());
// Close connection when tests are done
afterAll(async () => sequelize.close());

beforeEach(() => {
  // FIXME: Upstream probot needs an easier way to mock this out.
  robot.auth = jest.fn().mockReturnValue(Promise.resolve(new GitHub()));

  // Clear all data out of the test database
  return sequelize.truncate({ cascade: true });
});

module.exports = { robot, probot, app };
