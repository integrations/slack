const redis = require('redis');

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
          new Error(
            `Could not find the supplied id in the database. Maybe probot wasn't running during previous event delivery?\nValue is ${value}`,
          ),
        );
      } else {
        resolve(JSON.parse(value));
      }
    });
  });
}

function set(id, metaData) {
  redisClient.set(id, JSON.stringify(metaData), redis.print);
}

module.exports = {
  get,
  set,
};
