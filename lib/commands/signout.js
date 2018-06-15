const { SignOut } = require('../messages/flow');

const SignedParams = require('../signed-params');
const getProtocolAndHost = require('../get-protocol-and-host');

module.exports = async (req, res) => {
  const { slackUser, command } = res.locals;

  await slackUser.signout();

  // Send a message to each channel where subscriptions may need re-enabling

  const state = new SignedParams({
    trigger_id: command.trigger_id,
  });

  const { protocol, host } = getProtocolAndHost(req);

  const signInLink =
    `${protocol}://${host}/github/oauth/login?state=${await state.stringify()}`;
  return command.respond((new SignOut(signInLink, req.body.user_id)));
};
