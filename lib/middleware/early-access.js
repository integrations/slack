const hasEarlyAccess = require('../slack/has-early-access');

module.exports = (req, res, next) => {
  const params = { channelId: req.body.channel_id, teamId: req.body.team_id };
  if (hasEarlyAccess(params)) {
    req.log(params, 'Granting access to early access feature');
    // Move on to the next middleware in the stack
    next();
  } else {
    req.log(params, 'Early access feature is not enabled');
    // Move on to the next route
    next('route');
  }
};
