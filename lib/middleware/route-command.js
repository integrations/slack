const Command = require('../slack/command');

/**
 * Parses subcommands and routes the request based on the subcommand
 */
module.exports = function route(req, res, next) {
  req.log.debug({ command: req.body }, 'Received slash command');

  let callback;
  let command;

  // Skip timeout handling if request is a pending command
  if (req.query.trigger_id) {
    callback = null;
  } else {
    let timeout;

    callback = (message) => {
      req.log({ message }, 'Responding to slash command');
      res.status(200).json(message);

      // Sending response, so clear the request timeout.
      clearTimeout(timeout);

      // Any further responses should use the delayed response callback
      command.delay();
    };

    // Slack has a 3000ms timeout, so if we don't respond within that window, ack
    // the command and use the delayed response URL.
    timeout = setTimeout(() => {
      req.log('Command taking too long. Switching to delayed response.');

      // Ack the command
      command.respond({ response_type: 'in_channel' });
    }, 2500);
  }

  command = new Command(req.body, callback);

  if (command.subcommand) {
    const [url] = req.url.split('?');
    req.url = url + command.subcommand;
  }

  res.locals.command = command;

  // Simulate how commands will respond if they are delayed
  if (process.env.ARTIFICIAL_DELAY) {
    setTimeout(next, 3000);
  } else {
    next();
  }
};
