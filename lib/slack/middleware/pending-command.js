/**
  * This is a horrible hack to re-inject a pending command request, which
  * all needs refactored to extract the subscription logic into a place
  * where it can be called from a web request or a Slack command.
  */
module.exports = {
  store: async (req, res, next) => {
    const { PendingCommand } = res.locals.robot.models;
    const command = res.locals;

    if (command.user_id) {
      // Store the original request body
      await PendingCommand.create(command.user_id, req.body);
    }
    next();
  },

  restore: async (req, res, next) => {
    if (req.session && req.session.slackUserId) {
      const { SlackUser, PendingCommand } = res.locals.robot.models;
      const user = await SlackUser.findById(req.session.slackUserId);
      const body = await PendingCommand.find(user.slackId);

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
    await PendingCommand.delete(command.user_id);
    next();
  },
};
