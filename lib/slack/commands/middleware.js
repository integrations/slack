const crypto = require('crypto');

const expectedToken = Buffer.from(process.env.SLACK_VERIFICATION_TOKEN);

module.exports = {
  /**
   * Validates that the `token` matches the expected verification token
   */
  validate(req, res, next) {
    const actualToken = Buffer.from(req.body.token);
    const tokenIsValid = actualToken.length === expectedToken.length &&
      crypto.timingSafeEqual(actualToken, expectedToken);

    if (tokenIsValid) {
      next();
    } else {
      res.status(400).send('Invalid verificaton token');
    }
  },

  /**
   * Parses subcommands and routes the request based on the subcommand
   */
  route(req, res, next) {
    req.log.debug({ command: req.body }, 'Received slash command');

    const match = req.body.text.match(/^(\w+) *(.*)$/);

    if (match) {
      const [, subcommand, args] = match;

      // Store the subcommand so routes can read it
      req.body.subcommand = subcommand;

      // Remove subcommand from the command text
      req.body.text = args;

      // Append subcommand to the request URL to route accordingly
      req.url += subcommand;
    }

    res.on('finish', () => {
      req.log.debug({ response: res.body, command: req.body }, 'Response to command');
    });
    next();
  },

  async authenticate(req, res, next) {
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
  },

};
