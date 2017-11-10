/**
 * This module is responsible for figuring out which channels to route
 * notifications from GitHub.
 */

const {promisify} = require('util');
// FIXME: move these to some global app setup and inject storage dependency
const redis = require('redis');

const client = redis.createClient(process.env.REDIS_URL);

function key(resource) {
  return `subscription:${resource}`;
}

module.exports = {
  async lookup(resource) {
    return promisify(client.lrange).bind(client)(key(resource), 0, -1);
  },

  async subscribe(resource, target) {
    return promisify(client.rpush).bind(client)(key(resource), target);
  },

  async unsubscribe(resource, target) {
    return promisify(client.lrem).bind(client)(key(resource), 0, target);
  },

  async reset() {
    const keys = await promisify(client.keys).bind(client)(key('*'));
    if (keys.length > 0) {
      return promisify(client.del).bind(client)(...keys);
    }
  },
};
