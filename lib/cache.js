const Keyv = require('keyv');
const logger = require('probot/lib/logger');

const keyv = new Keyv({
  uri: process.env.REDIS_URL,
  ttl: 30 * 60 * 1000,
});

keyv.on('error', logger.error.bind(logger));

module.exports = keyv;
