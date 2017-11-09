/**
 * This module is responsible for figuring out which channels to route
 * notifications from GitHub.
 */

// FIXME: move these to some global app setup and inject storage dependency
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

function key(resource) {
  return `subscription:${resource}`
}

module.exports = {
  async lookup(resource) {
    return redis.lrange(key(resource), 0, -1)
  },

  async subscribe(resource, target) {
    return redis.rpush(key(resource), target)
  },

  async unsubscribe(resource, target) {
    return redis.lrem(key(resource), 0, target)
  },

  async reset() {
    const keys = await redis.keys(key('*'));
    if (keys.length > 0) {
      return redis.del(...keys)
    }
  }
}
