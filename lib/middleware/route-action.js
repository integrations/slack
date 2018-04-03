const logger = require('probot/lib/logger');
/**
 * Routes the request based on event type
 */
module.exports = function route(req, res, next) {
  const action = req.body.callback_id.substr(0, req.body.callback_id.indexOf('-'));

  if (action) {
    logger.debug({ ...req.body, token: undefined }, 'Action received from Slack');
    // Append action derived from callback_id to the request URL to route accordingly
    req.url += `:${action}`;
  }

  next();
};
