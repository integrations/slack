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

  app.post(
    /(?:un)?subscribe/,
    middleware.authenticate((req, res, next) => {
      // Modify request URL and pass on to the next matching route. In a normal
      // web application, this would simply be a redirect.
      req.url = '/signin';
      next('route');
    }),
    middleware.getResource,
    middleware.getInstallation,
    subscribe,
  );

  app.post('/signin', signin);

  app.post(/.*/, help);

  robot.log.trace('Loaded commands');
};
