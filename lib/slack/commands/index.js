// Slash Commands - https://api.slack.com/slash-commands

const middleware = require('./middleware');
const subscribe = require('./subscribe');
const signin = require('./signin');

module.exports = (robot) => {
  const app = robot.route('/slack/command');

  app.use(middleware.validate);
  app.use(middleware.route);

  app.post(/(?:un)?subscribe/,
    middleware.authenticate,
    middleware.getResource,
    middleware.getInstallation,
    subscribe);

  app.post('/signin', signin);

  robot.log.trace('Loaded commands');
};
