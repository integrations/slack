// Slash Commands - https://api.slack.com/slash-commands

// FIXME: remove this
/* eslint-disable global-require */

const slackAdapter = require('@probot/slack-adapter');

const middleware = require('../middleware');
const subscribe = require('./subscribe');
const listSubscriptions = require('./list-subscriptions');

const { Exception } = require('../messages/flow');

module.exports = (robot) => {
  slackAdapter(robot);

  // Error handler
  robot.commands.use(async (command, next) => {
    try {
      return await next();
    } catch (err) {
      // FIXME: include command in context
      robot.log.error(err);
      // FIXME: get res.sentry
      command.respond(new Exception('fixme'));
    }
  });

  robot.commands.use((command, next) => {
    // If command is `github-*`, replace it with the first argument
    if (/^github(-\w+)?$/.test(command.name)) {
      Object.assign(command, {
        // FIXME: consider adding a `namespace` feature to @probot/commands
        namespace: command.name,
        name: command.args[0],
        args: command.args.slice(1),
      });
    }

    robot.log({ command }, 'Received Command');
    return next();
  });

  // For testing error handling
  robot.commands.register(require('./boom'));
  robot.commands.register(require('./signin'));
  robot.commands.register(require('./help'));

  robot.commands.use((command) => {
    console.log("WAT?, NO COMMAND?", command);
    throw new Error(`Command not found: ${command.name}`);
  });

  // const app = robot.route('/slack/command');
  //
  // app.use(middleware.pendingCommand.restore);
  // app.use(middleware.validate);
  // app.use(middleware.pendingCommand.store);
  // app.use(middleware.sentryContext);
  // app.use(middleware.routeCommand);
  //
  // app.post('/subscribe', listSubscriptions);
  //
  // app.post(
  //   /(?:un)?subscribe/,
  //   middleware.authenticate,
  //   middleware.getResource,
  //   middleware.getInstallation,
  //   middleware.pendingCommand.clear,
  //   subscribe,
  // );


  robot.log.trace('Loaded commands');
};
