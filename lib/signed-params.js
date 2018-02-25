const { promisify } = require('util');
const jwt = require('jsonwebtoken');

const sign = promisify(jwt.sign);
const verify = promisify(jwt.verify);

const secret = process.env.GITHUB_CLIENT_SECRET;

class SignedParams {
  constructor(params) {
    Object.assign(this, params);
  }

  stringify(options = { expiresIn: '1h' }) {
    // Convert to a plain ol' object
    const plain = { ...this };
    return sign(plain, secret, options);
  }
}

SignedParams.load = async (string) => {
  const params = await verify(string, secret);
  return new SignedParams(params);
};


module.exports = SignedParams;
