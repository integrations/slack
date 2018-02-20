const Command = require('../command');

/**
 * Parses subcommands and routes the request based on the subcommand
 */
module.exports = function route(req, res, next) {
  req.log.debug({ command: req.body }, 'Received slash command');

  const command = new Command(req.body);

  if (command.subcommand) {
    req.url += command.subcommand;
  }

  res.locals.command = command;

  res.on('finish', () => {
    req.log.debug({ response: res.body, command: req.body }, 'Response to command');
  });
  next();
};
