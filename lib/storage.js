const redis = require('redis');
const { promisify } = require('util');

const redisClient = redis.createClient(process.env.REDIS_URL);

redisClient.on('error', (err) => {
  console.error(err);
});

async function get(id) {
  const value = await promisify(redisClient.get).bind(redisClient)(id);
  return value && JSON.parse(value);
}

function set(id, metaData) {
  // set expiry to 30min (30 * 60 = 1800)
  redisClient.set(id, JSON.stringify(metaData), 'EX', 1800, redis.print);
}

function clear() {
  return promisify(redisClient.flushdb).bind(redisClient)();
}

module.exports = {
  get,
  set,
  clear,
};
