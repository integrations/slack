const models = require('./db/models');
const setupSlack = require('./slack');
const setupGitHub = require('./github');

module.exports = (robot) => {
  // eslint-disable-next-line no-param-reassign
  robot.models = models(robot);

  setupSlack(robot);
  setupGitHub(robot);

  robot.route().get('/boom', () => {
    throw new Error('Boom');
  });
};
