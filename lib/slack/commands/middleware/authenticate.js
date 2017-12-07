module.exports = async function authenticate(req, res, next) {
  const { User, SlackUser, GitHubUser } = res.locals.robot.models;
  const slackUser = await SlackUser.findOne({
    where: { slackId: req.body.user_id },
    include: [{ model: User, include: [GitHubUser] }],
  });

  if (slackUser) {
    req.log.debug({ user_id: req.body.user_id }, 'Authenticated user');

    Object.assign(res.locals, {
      slackUser,
      user: slackUser.User,
      gitHubUser: slackUser.User.GitHubUser,
    });
    next();
  } else {
    req.log.debug({ user_id: req.body.user_id }, 'User not found');
    req.url = '/signin';
    next('route');
  }
};
