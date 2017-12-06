// Slash Commands - https://api.slack.com/slash-commands

const middleware = require('./middleware');
const subscribe = require('./subscribe');
const signin = require('./signin');

module.exports = (robot) => {
  const app = robot.route('/slack/command');

  // Make robot available
  app.use((req, res, next) => {
    res.locals.robot = robot;
    next();
  });

  app.use(middleware.validate);
  app.use(middleware.route);
  app.post(/(?:un)?subscribe/, middleware.authenticate, subscribe);
  app.post('/signin', signin);

  robot.log.trace('Loaded commands');
};
