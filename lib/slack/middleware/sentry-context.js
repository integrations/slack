const Raven = require('raven');

module.exports = (req, res, next) => {
  Raven.context(() => {
    Raven.mergeContext({
      user: {
        username: req.body.user_name,
        id: req.body.user_id,
        workspace: req.body.team_domain,
        workspace_id: req.body.team_id,
      },
      channel_id: req.body.channel_id,
      channel_name: req.body.channel_name,
      trigger_id: req.body.trigger_id,
    });

    next();
  });
};
