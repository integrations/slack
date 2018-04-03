const Keyv = require('keyv');
const logger = require('./logger');

const keyv = new Keyv({
  uri: process.env.REDIS_URL,
  ttl: 30 * 60 * 1000,
});

keyv.on('error', logger.error.bind(logger));

async function fetch(key, callback, ttl = undefined) {
  let value = await this.get(key);
  if (value === undefined) {
    value = await callback();
    this.set(key, value, ttl);
  }
  return value;
}

keyv.fetch = fetch.bind(keyv);

module.exports = keyv;
