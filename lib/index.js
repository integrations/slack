const setupSlack = require('./slack');
const setupGitHub = require('./github');

module.exports = (robot) => {
  setupSlack(robot);
  setupGitHub(robot);

  robot.route().get('/boom', () => {
    throw new Error('Boom');
  });
};
