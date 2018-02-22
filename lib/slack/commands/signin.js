const { SignIn } = require('../renderer/flow');

const SignedParams = require('../../signed-params');

// @todo should also be able to sign out (/github signout)
module.exports = async (req, res) => {
  const { command } = res.locals;

  // generate random state
  const state = new SignedParams({
    teamId: command.team_id,
    userId: command.user_id,
    channelId: command.channel_id,
    responseUrl: command.response_url,
  });

  const escapedEncryptedState = await state.stringify();
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.get('host');

  // returns slack message with link to click
  const signInLink =
    `${protocol}://${host}/github/oauth/login?state=${escapedEncryptedState}`;
  res.json(new SignIn(signInLink));
};
