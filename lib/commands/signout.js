const { SignOut } = require('../messages/flow');

const SignedParams = require('../signed-params');
const getProtocolAndHost = require('../get-protocol-and-host');
const signout = require('../activity/signout');

module.exports = async (req, res) => {
  const {
    slackUser,
    slackWorkspace,
    command,
    robot,
  } = res.locals;

  await signout(robot, slackUser, slackWorkspace);

  const state = new SignedParams({
    teamSlackId: command.team_id,
    teamSlackDomain: command.team_domain,
    userSlackId: command.user_id,
    channelSlackId: command.channel_id,
    replaySlashCommand: false,
  });

  const { protocol, host } = getProtocolAndHost(req);

  const signInLink =
    `${protocol}://${host}/github/oauth/login?state=${await state.stringify()}`;
  return command.respond((new SignOut(signInLink, req.body.user_id)));
};
