const createProbot = require('probot');
const GitHub = require('github');
const app = require('../..');

module.exports = () => {
  const probot = createProbot({});

  const robot = probot.load(app);

  // FIXME: Upstream probot needs an easier way to mock this out.
  robot.auth = jest.fn().mockReturnValue(Promise.resolve(new GitHub()));

  return { robot, probot, app };
};
