/**
 * Routes the request based on event type
 */
module.exports = function route(req, res, next) {
  req.log.debug({ ...req.body, token: undefined }, 'Action received from Slack');

  // Cancel actions don't get routed. They delete the originating message right away
  if (res.locals.action === 'cancel') {
    return res.send({
      delete_original: true,
    });
  }
  req.url += `:${req.body.callback_id}`;
  next();
};
