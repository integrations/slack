const { SignOut } = require('../messages/flow');

const SignedParams = require('../signed-params');

module.exports = async (req, res) => {
  await res.locals.slackUser.update({
    githubId: null,
  });

  const { command } = res.locals;

  const state = new SignedParams({
    trigger_id: command.trigger_id,
  });

  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.get('host');

  // To sign back in click the button:
  const signInLink =
    `${protocol}://${host}/github/oauth/login?state=${await state.stringify()}`;
  return command.respond((new SignOut(signInLink, req.body.user_id)));
};
