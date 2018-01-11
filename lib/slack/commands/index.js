// Slash Commands - https://api.slack.com/slash-commands

const middleware = require('../middleware');
const subscribe = require('./subscribe');
const signin = require('./signin');
const listSubscriptions = require('./list-subscriptions');
const help = require('./help');

module.exports = (robot) => {
  const app = robot.route('/slack/command');

  app.use(middleware.validate);
  app.use(middleware.routeCommand);

  app.post('/subscribe', listSubscriptions);

  app.post(/(?:un)?subscribe/,
    middleware.authenticate,
    middleware.getResource,
    middleware.getInstallation,
    subscribe);

  app.post('/signin', signin);

  app.post(/.*/, help);

  robot.log.trace('Loaded commands');
};
