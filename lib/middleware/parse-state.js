/**
 * Parsing the webhook state information from Slack dialogs to field res.locals values
 */
module.exports = function parseState(req, res, next) {
  if (req.body.state) {
    const state = JSON.parse(req.body.state);
    if (state.resource) {
      res.locals.resource = state.resource;
    }
    if (state.channel) {
      res.locals.channel = state.channel;
    }
  }
  next();
};
