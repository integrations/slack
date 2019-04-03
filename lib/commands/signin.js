const { SignIn } = require('../messages/flow');

const SignedParams = require('../signed-params');
const getProtocolAndHost = require('../get-protocol-and-host');
const githubSignInAttempt = require('../github-sign-in-attempt');

module.exports = async (req, res) => {
  const { command } = res.locals;

  const state = new SignedParams({
    trigger_id: command.trigger_id,
    teamSlackId: command.team_id,
    teamSlackDomain: command.team_domain,
    userSlackId: command.user_id,
    channelSlackId: command.channel_id,
    replaySlashCommand: !(command.subcommand.startsWith('signin') || command.subcommand.startsWith('signout')),
  });

  const { protocol, host } = getProtocolAndHost(req);

  await githubSignInAttempt.initiate(command.team_id, command.user_id);
  // returns slack message with link to click
  const signInLink =
    `${protocol}://${host}/github/oauth/login?state=${await state.stringify()}`;
  return command.respond((new SignIn(signInLink)));
};
