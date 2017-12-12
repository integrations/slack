const jwt = require('jsonwebtoken');
const { promisify } = require('util');

const { SignIn } = require('../renderer/flow');

// @todo should also be able to sign out (/github signout)
module.exports = async (req, res) => {
  const command = req.body;
  // generate random state

  // returns slack message with link to click

  const state = {
    teamId: command.team_id,
    userId: command.user_id,
    channelId: command.channel_id,
    responseUrl: command.response_url,
  };

  const escapedEncryptedState = await promisify(jwt.sign)(state, process.env.GITHUB_CLIENT_SECRET, { expiresIn: '1h' });
  const signInLink =
    `https://${process.env.APP_HOST}/github/oauth/login?state=${escapedEncryptedState}`;
  res.json(new SignIn(signInLink));
};
