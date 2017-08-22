const redis = require("redis"),
  redisClient = redis.createClient();

redisClient.on("error", (err) => {
    console.log("Error " + err);
});

function retrieveStoredMetadata(id) {
  return new Promise((resolve, reject) => {
    redisClient.get(id, (err, value) => {
      if (err) {
        reject(new Error(err));
      } else if (!value) {
        reject(new Error(`Could not find the supplied id in the database: Value is ${value}`));
      } else {
        resolve(value);
      }
    });
  })
}

function storeMessageMetadata(id, metaData) {
  redisClient.set(id, JSON.stringify(metaData), redis.print)
}

module.exports = {
  retrieveStoredMetadata,
  storeMessageMetadata,
}
