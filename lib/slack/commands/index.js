// Slash Commands - https://api.slack.com/slash-commands

const middleware = require('../middleware');
const subscribe = require('./subscribe');
const signin = require('./signin');
const listSubscriptions = require('./list-subscriptions');
const help = require('./help');

module.exports = (robot) => {
  const app = robot.route('/slack/command');

  app.use(async (req, res, next) => {
    if (req.session && req.session.slackUserId) {
      const { SlackUser, PendingCommand } = robot.models;
      const user = await SlackUser.findById(req.session.slackUserId);
      const command = await PendingCommand.find(user.slackId);
      if (command) {
        // This is a horrible hack to re-inject a pending command request, which
        // all needs refactored to extract the subscription logic into a place
        // where it can be called from a web request or a Slack command.
        req.body = command;
        req.method = 'POST';
      }
    }
    next();
  });
  app.use(middleware.validate);
  app.use(middleware.sentryContext);
  app.use(async (req, res, next) => {
    const { PendingCommand } = robot.models;
    if (req.body.user_id) {
      await PendingCommand.create(req.body.user_id, req.body);
    }
    next();
  });
  app.use(middleware.routeCommand);

  // For testing error handling
  app.post('/boom', () => {
    throw new Error('Boom');
  });

  app.post('/subscribe', listSubscriptions);

  app.post(
    /(?:un)?subscribe/,
    middleware.authenticate,
    middleware.getResource,
    middleware.getInstallation,
    subscribe,
  );

  app.post('/signin', signin);

  app.post(/.*/, help);

  robot.log.trace('Loaded commands');
};
