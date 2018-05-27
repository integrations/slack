const { SlackWorkspace, SlackUser, GitHubUser } = require('../models');

/* Make gitHubUser available for message_actions */

module.exports = async function attachGitHubUserMetaData(req, res, next) {
  const body = JSON.parse(req.body.payload);
  const userId = body.user.id;
  const teamId = body.team.id;

  const slackWorkspace = await SlackWorkspace.findOne({ where: { slackId: teamId } });
  const [slackUser] = await SlackUser.findOrCreate({
    where: { slackId: userId, slackWorkspaceId: slackWorkspace.id },
    include: [GitHubUser, { model: SlackWorkspace, where: { slackId: teamId } }],
  });

  // Store metadata in res.locals so it can be used later in the request
  Object.assign(res.locals, {
    gitHubUser: slackUser.GitHubUser,
  });

  next();
};
