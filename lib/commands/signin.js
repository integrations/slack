const { SignIn } = require('../messages/flow');

const SignedParams = require('../signed-params');
const getProtocolAndHost = require('../get-protocol-and-host');

module.exports = async (req, res) => {
  const { command } = res.locals;

  const state = new SignedParams({
    trigger_id: command.trigger_id,
  });

  const { protocol, host } = getProtocolAndHost(req);

  // returns slack message with link to click
  const signInLink =
    `${protocol}://${host}/github/oauth/login?state=${await state.stringify()}`;
  return command.respond((new SignIn(signInLink)));
};
