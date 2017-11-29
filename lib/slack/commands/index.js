// Slash Commands - https://api.slack.com/slash-commands

const subscribe = require('./subscribe');
const signin = require('./signin');
const crypto = require('crypto');


module.exports = (robot) => {
  robot.route('/slack').post('/command', async (req, res) => {
    robot.log.debug({ command: req.body }, 'Received slash command');

    const passedTokenBuffer = Buffer.from(req.body.token);
    const correctTokenBuffer = Buffer.from(process.env.SLACK_VERIFICATION_TOKEN);
    if (
      passedTokenBuffer.length !== correctTokenBuffer.length &&
      !crypto.timingSafeEqual(passedTokenBuffer, correctTokenBuffer)
    ) {
      res.status(400).send('Invalid verification token');
    }

    if (new RegExp(/signin$/g).exec(req.body.text)) {
      const response = await signin(req.body);
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
