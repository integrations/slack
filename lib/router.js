const { promisify } = require('util');
// FIXME: move these to some global app setup and inject storage dependency
const redis = require('redis');

function key(resource) {
  return `subscription:${resource}`;
}

class Router {
  constructor() {
    this.client = redis.createClient(process.env.REDIS_URL);
  }

  async lookup(resource) {
    return promisify(this.client.smembers).bind(this.client)(key(resource));
  }

  async subscribe(resource, target) {
    return promisify(this.client.sadd).bind(this.client)(key(resource), target);
  }

  async unsubscribe(resource, target) {
    return promisify(this.client.srem).bind(this.client)(key(resource), target);
  }

  async reset() {
    const keys = await promisify(this.client.keys).bind(this.client)(key('*'));
    if (keys.length > 0) {
      return promisify(this.client.del).bind(this.client)(...keys);
    }
  }
}

module.exports = Router;
