// Slash Commands - https://api.slack.com/slash-commands

const middleware = require('../middleware');
const subscribe = require('./subscribe');
const signin = require('./signin');
const issueState = require('./issue-state');
const listSubscriptions = require('./list-subscriptions');
const help = require('./help');
const debug = require('./debug');
const create = require('../create');
const { settings } = require('../user-settings');

module.exports = (robot) => {
  const app = robot.route('/slack/command');

  app.use(middleware.pendingCommand.restore);
  app.use(middleware.validate);
  app.use(middleware.pendingCommand.store);
  app.use(middleware.sentryContext);
  app.use(middleware.routeCommand);

  // For testing error handling
  app.post('/boom', () => {
    throw new Error('Boom');
  });

  app.post('/subscribe', listSubscriptions);

  app.post(
    /(?:un)?subscribe/,
    middleware.authenticate,
    middleware.getResource('repo'),
    middleware.getInstallation,
    middleware.pendingCommand.clear,
    subscribe,
  );

  app.post(
    '/settings',
    middleware.authenticate,
    settings,
  );

  app.post(
    '/close',
    middleware.authenticate,
    middleware.getResource(),
    middleware.getInstallation,
    issueState('closed'),
  );

  app.post(
    '/reopen',
    middleware.authenticate,
    middleware.getResource(),
    middleware.getInstallation,
    issueState('open'),
  );

  app.post('/signin', signin);

  app.post('/debug', debug);

  app.post(
    /open/,
    middleware.authenticate,
    middleware.getResource('repo'),
    middleware.getInstallation,
    create.openDialog,
  );

  app.post(/.*/, help);

  app.use(middleware.validationError);

  robot.log.trace('Loaded commands');
};
