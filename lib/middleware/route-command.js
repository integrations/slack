const Command = require('../slack/command');

/**
 * Parses subcommands and routes the request based on the subcommand
 */
module.exports = function route(req, res, next) {
  req.log.debug({ command: req.body }, 'Received slash command');

  const command = new Command(req.body, res.json.bind(res));

  const timeout = setTimeout(() => {
    req.log({ command }, 'Command taking too long. Switching to delayed response.');

    // Ack the command
    res.status(200).send({ response_type: 'in_channel' });

    // Any further responses should use the delayed response callback
    command.delay();
  }, 2500);

  if (command.subcommand) {
    const [url] = req.url.split('?');
    req.url = url + command.subcommand;
  }

  res.locals.command = command;

  res.on('finish', () => {
    clearTimeout(timeout);

    // Any further responses should use the delayed response callback
    command.delay();

    req.log.debug({ response: res.body, command: req.body }, 'Response to command');
  });
  next();
};
