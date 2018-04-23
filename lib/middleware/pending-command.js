const { PendingCommand } = require('../models');

/**
  * This is a horrible hack to re-inject a pending command request, which
  * all needs refactored to extract the subscription logic into a place
  * where it can be called from a web request or a Slack command.
  */
module.exports = {
  store: async (req, res, next) => {
    const command = req.body;

    // Store the original request body
    await PendingCommand.create(command.trigger_id, command);

    next();
  },

  restore: async (req, res, next) => {
    if (req.query.trigger_id) {
      const body = await PendingCommand.find(req.query.trigger_id);
      req.log({ command: body }, 'Restoring pending command');

      if (body) {
        req.body = body;
        req.method = 'POST';
      }
    }

    next();
  },

  clear: async (req, res, next) => {
    const { command } = res.locals;
    await PendingCommand.delete(command.trigger_id);
    next();
  },
};
