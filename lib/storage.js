const redis = require('redis');
const { promisify } = require('util');

const redisClient = redis.createClient(process.env.REDIS_URL);

redisClient.on('error', (err) => {
  console.error(err);
});

function get(id) {
  return new Promise((resolve, reject) => {
    redisClient.get(id, (err, value) => {
      if (err) {
        reject(new Error(err));
      } else if (!value) {
        reject(
          `Could not find the supplied id in the database. Maybe probot wasn't running during previous event delivery?\nValue is ${value}`,
        );
      } else {
        resolve(JSON.parse(value));
      }
    });
  });
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
