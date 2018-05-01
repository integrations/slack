/**
 * Routes the request based on event type
 */
module.exports = function route(req, res, next) {
  req.log.debug({ ...req.body, token: undefined }, 'Action received from Slack');

  // Cancel actions don't get routed. They delete the originating message right away
  req.url += `:${req.body.type}:${req.body.callback_id}`;
  if (req.body.type === 'interactive_message') {
    req.url += `:${req.body.actions[0].name}`;
    Object.assign(res.locals, {
      action: req.body.actions[0].name,
      value: req.body.actions[0].value,
    });
  }
  next();
};
