const { SlackWorkspace, SlackUser, GitHubUser } = require('../models');

/**
 * Ensure that the current Slack user is associated with a GitHub user.
 */
module.exports = async function authenticate(req, res, next) {
  const slackId = req.body.user_id;
  const teamId = req.body.team_id;

  const slackUser = await SlackUser.findOne({
    where: { slackId },
    include: [
      GitHubUser,
      { model: SlackWorkspace, where: { slackId: teamId } },
    ],
  });

  if (slackUser) {
    req.log.debug({ slackId }, 'Authenticated user');

    // Store current user in res.locals so it can be used later in the request
    Object.assign(res.locals, {
      slackUser,
      slackWorkspace: slackUser.SlackWorkspace,
      gitHubUser: slackUser.GitHubUser,
    });

    next();
  } else {
    req.log.debug({ slackId }, 'User not found');

    // Modify request URL and pass on to the next matching route. In a normal
    // web application, this would simply be a redirect.
    req.url = '/signin';
    next('route');
  }
};
