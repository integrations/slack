const Keyv = require('keyv');
const KeyvRedis = require('@keyv/redis');

const logger = require('./logger');

const redisOpts = {};

if (process.env.REDIS_CA) {
  redisOpts.tls = {
    ca: process.env.REDIS_CA,
  };
}

// Create our own adapter to work with `rediss` urls and custom CAs
const keyvRedis = new KeyvRedis(process.env.REDIS_URL, redisOpts);
const keyv = new Keyv({
  store: keyvRedis,
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
