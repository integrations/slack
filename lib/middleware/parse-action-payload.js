/**
 * Parses the content Slack posts to /actions and converts it into a format
 * similar to the one Slack posts to /events
 */
module.exports = function parseActionPayload(req, res, next) {
  if (!req.body.payload) {
    return res.status(400).send('Invalid format');
  }
  req.body = JSON.parse(req.body.payload);
  next();
};
