/**
 * Routes the request based on event type
 */
module.exports = function route(req, res, next) {
  const event = req.body.event && req.body.event.type;

  if (event) {
    // Append event name to the request URL to route accordingly
    req.url += `.${event}`;
  }

  next();
};
