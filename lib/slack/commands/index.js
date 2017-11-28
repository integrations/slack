// Slash Commands - https://api.slack.com/slash-commands

const subscribe = require('./subscribe');
const router = require('../../router');

module.exports = (robot) => {
  robot.route('/slack').post('/command', async (req, res) => {
    robot.log.debug({ command: req.body }, 'Received slash command');

    // TODO: verify `token`

    const command = {
      name: req.body.command,
      args: req.body.text,
      context: req.body,
    };

    const response = await subscribe(command, { robot, router });

    robot.log.debug({ response, command: req.body }, 'Response from command');

    res.status(200).json(response);
  });

  robot.log.trace('Loaded commands');
};
