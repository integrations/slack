// Slash Commands - https://api.slack.com/slash-commands

const GitHubAPI = require('github');

const subscribe = require('./subscribe');

const router = require('../../router');

const Resolver = require('../../resolver');

const resolver = new Resolver(new GitHubAPI());

module.exports = (robot) => {
  robot.route('/slack').post('/command', async (req, res) => {
    robot.log.debug({ command: req.body }, 'Received slash command');

    // TODO: verify `token`

    const command = {
      name: req.body.command,
      args: req.body.text,
      context: req.body,
    };

    const response = await subscribe(command, { router, resolver });

    res.json({
      response_type: 'in_channel',
      text: response,
    });
  });

  robot.log.trace('Loaded commands');
};
