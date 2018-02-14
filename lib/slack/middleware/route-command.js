/**
 * Parses subcommands and routes the request based on the subcommand
 */
module.exports = function route(req, res, next) {
  req.log.debug({ command: req.body }, 'Received slash command');

  // Check for subcommand in the command text
  const match = req.body.text.match(/^(\w+) *(.*)$/);

  if (match) {
    const [, subcommand, args] = match;

    // Store the subcommand so routes can read it
    req.body.subcommand = subcommand;

    // Remove subcommand from the command text
    req.body.text = args;

    // Save array of args
    req.body.args = args.split(' ');

    // Append subcommand to the request URL to route accordingly
    req.url += subcommand;
  }

  res.on('finish', () => {
    req.log.debug({ response: res.body, command: req.body }, 'Response to command');
  });
  next();
};
