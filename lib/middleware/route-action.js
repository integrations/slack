/**
 * Routes the request based on action `type`, `callback_id`,
 *  and in case of interactive messages also `action`
 */
module.exports = function route(req, res, next) {
  req.log.debug({ ...req.body, token: undefined }, 'Action received from Slack');

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
