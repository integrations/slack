const { SignIn } = require('../renderer/flow');

const SignedParams = require('../../signed-params');

// @todo should also be able to sign out (/github signout)
module.exports = async (req, res) => {
  const { command } = res.locals;

  const state = new SignedParams({
    trigger_id: command.trigger_id,
  });

  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.get('host');

  // returns slack message with link to click
  const signInLink =
    `${protocol}://${host}/github/oauth/login?state=${await state.stringify()}`;
  res.json(new SignIn(signInLink));
};
