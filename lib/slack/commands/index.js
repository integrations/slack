// Slash Commands - https://api.slack.com/slash-commands

const subscribe = require('./subscribe');
const link = require('./link');


module.exports = (robot) => {
  robot.route('/slack').post('/command', async (req, res) => {
    robot.log.debug({ command: req.body }, 'Received slash command');

    if (req.body.token !== process.env.SLACK_VERIFICATION_TOKEN) {
      res.status(400).send('Invalid verification token');
    }

    if (new RegExp(/link$/g).exec(req.body.text)) {
      const response = await link(req.body);
      res.status(200).json(response);
    }

    if (new RegExp(/subscribe(.*)/g).exec(req.body.text)) {
      const response = await subscribe(req.body, { robot });

      robot.log.debug({ response, command: req.body }, 'Response from command');

      res.status(200).json(response);
    }
  });

  robot.log.trace('Loaded commands');
};
