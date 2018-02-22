/**
  * This is a horrible hack to re-inject a pending command request, which
  * all needs refactored to extract the subscription logic into a place
  * where it can be called from a web request or a Slack command.
  */

const SignedParams = require('../../signed-params');

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
    if (req.session && req.session.state) {
      const { PendingCommand } = res.locals.robot.models;
      const { teamId, userId } = await SignedParams.load(req.session.state);
      const body = await PendingCommand.find(teamId, userId);

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
