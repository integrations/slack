const crypto = require('crypto');

const expectedToken = Buffer.from(process.env.SLACK_VERIFICATION_TOKEN);
const oldToken = Buffer.from(process.env.SLACK_OLD_VERIFICATION_TOKEN);

/**
 * Validates that the `token` matches the expected verification token
 */
module.exports = function validate(req, res, next) {
  const actualToken = Buffer.from(req.body.token);

  if (actualToken.length === expectedToken.length &&
    crypto.timingSafeEqual(actualToken, expectedToken)) {
    next();
  } else if (actualToken.length === oldToken.length &&
      crypto.timingSafeEqual(actualToken, oldToken)) {
    next();
  } else {
    res.status(400).send('Invalid verificaton token');
  }
};
