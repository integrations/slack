/**
 * Routes the request based on event type
 */
module.exports = function route(req, res, next) {
  req.log.debug({ ...req.body, token: undefined }, 'Action received from Slack');
  req.url += `:${req.body.callback_id}`;
  next();
};
