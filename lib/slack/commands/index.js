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
    // does slack user exist? if not, create
    // is there a github user for this slack user?
    // if not, send link to auth via github app OAuth
      // need to pass in slack team id, user id, and channel id
      // jwt with base64 (could use existing github private key)
    // send epemeral message with button "Complete setup". Once they've finished authing,
    // they can hit the button, and we'll know what to do

    const response = await subscribe(command, { router, resolver });

    robot.log.debug({ response, command: req.body }, 'Response from command');

    res.status(200).json({ attachments: [response] });
  });

  robot.log.trace('Loaded commands');
};
