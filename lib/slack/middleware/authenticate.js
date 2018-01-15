/* eslint-disable indent */
/* See https://github.com/eslint/typescript-eslint-parser/issues/344 */

/**
 * Middleware to authenticate a user.
 *
 * @param {function} handler - middleware to call if a user is not authenticated.
 */
module.exports = handler => async function authenticate(req, res, next) {
  const { SlackWorkspace, SlackUser, GitHubUser } = res.locals.robot.models;

  const slackId = req.body.event ? req.body.event.user : req.body.user_id;
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

    handler(req, res, next);
  }
};
