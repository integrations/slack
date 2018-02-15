const crypto = require('crypto');

const expectedToken = Buffer.from(process.env.SLACK_VERIFICATION_TOKEN);

/**
 * Validates that the `token` matches the expected verification token
 */
module.exports = function validate(req, res, next) {
  const actualToken = Buffer.from(req.body.token);
  const matches = actualToken.length === expectedToken.length &&
    crypto.timingSafeEqual(actualToken, expectedToken);

  if (matches) {
    next();
  } else {
    res.status(400).send('Invalid verificaton token');
  }
};
