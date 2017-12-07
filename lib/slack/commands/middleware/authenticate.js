/**
 * Authenticate
 */
module.exports = async function authenticate(req, res, next) {
  const { User, SlackUser, GitHubUser } = res.locals.robot.models;
  const slackId = req.body.user_id;

  const slackUser = await SlackUser.findOne({
    where: { slackId },
    include: [{ model: User, include: [GitHubUser] }],
  });

  if (slackUser) {
    req.log.debug({ user_id: req.body.user_id }, 'Authenticated user');

    // Store current user in res.locals so it can be used later in the request
    Object.assign(res.locals, {
      slackUser,
      user: slackUser.User,
      gitHubUser: slackUser.User.GitHubUser,
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
