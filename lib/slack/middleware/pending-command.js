/**
  * This is a horrible hack to re-inject a pending command request, which
  * all needs refactored to extract the subscription logic into a place
  * where it can be called from a web request or a Slack command.
  */
module.exports = {
  store: async (req, res, next) => {
    const { PendingCommand } = res.locals.robot.models;
    const command = req.body;

    if (command.user_id) {
      // Store the original request body
      await PendingCommand.create(command.team_id, command.user_id, command);
    }
    next();
  },

  restore: async (req, res, next) => {
    if (req.session && req.session.slackUserId) {
      const { SlackUser, SlackWorkspace, PendingCommand } = res.locals.robot.models;
      const user = await SlackUser.findById(req.session.slackUserId, {
        include: [SlackWorkspace],
      });
      const body = await PendingCommand.find(user.SlackWorkspace.slackId, user.slackId);

      if (body) {
        req.body = body;
        req.method = 'POST';
      }
    }
    next();
  },

  clear: async (req, res, next) => {
    const { PendingCommand } = res.locals.robot.models;
    const { command } = res.locals;
    await PendingCommand.delete(command.team_id, command.user_id);
    next();
  },
};
