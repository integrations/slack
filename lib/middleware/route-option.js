/**
 * Routes the request based on action `type`, `callback_id`, and `name`
 */
module.exports = function routeOption(req, res, next) {
  req.log.debug({ ...req.body, token: undefined }, 'Option load received from Slack');

  req.url += `:${req.body.type}:${req.body.callback_id}:${req.body.name}`;
  next();
};
