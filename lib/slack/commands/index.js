// Slash Commands - https://api.slack.com/slash-commands

const subscribe = require('./subscribe');
const signin = require('./signin');
const crypto = require('crypto');

const expectedToken = Buffer.from(process.env.SLACK_VERIFICATION_TOKEN);

function validateSlashCommand(req, res, next) {
  const actualToken = Buffer.from(req.body.token);
  const tokenIsValid = actualToken.length === expectedToken.length &&
    crypto.timingSafeEqual(actualToken, expectedToken);

  if (tokenIsValid) {
    next();
  } else {
    res.status(400).send('Invalid verificaton token');
  }
}

function routeSlackCommands(req, res, next) {
  req.log.debug({ command: req.body }, 'Received slash command');
  const match = req.body.text.match(/^(\w+) ?(.*)$/);
  if (match) {
    const [, subcommand, args] = match;
    req.url += `${subcommand}`;
    req.body.subcommand = subcommand;
    req.body.text = args;
  }

  res.on('finish', () => {
    req.log.debug({ response: res.body, command: req.body }, 'Response from command');
  });
  next();
}

module.exports = (robot) => {
  const app = robot.route('/slack/command');

  // Make robot available
  app.use((req, res, next) => {
    res.locals.robot = robot;
    next();
  });

  app.use(validateSlashCommand);
  app.use(routeSlackCommands);
  app.post(/(?:un)?subscribe/, subscribe);

  app.post('/signin', async (req, res) => {
    const response = await signin(req.body);
    res.status(200).json(response);
  });

  robot.log.trace('Loaded commands');
};
