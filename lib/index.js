const models = require('./db/models');
const Router = require('./router');
const setupSlack = require('./slack');
const setupGitHub = require('./github');

module.exports = (robot) => {
  /* eslint-disable no-param-reassign */
  robot.models = models(robot);
  robot.subscriptions = new Router(robot.models.Subscription);

  setupSlack(robot);
  setupGitHub(robot);

  robot.route().get('/boom', () => {
    throw new Error('Boom');
  });
};
