
// const Sequelize = require('sequelize');
// const sequelize = new Sequelize('postgres://localhost:5432/slack-dev');
//
// const Subscription = sequelize.define('subscription', {
//   account_id: {
//     type: Sequelize.BIGINT,
//     allowNull: false
//   },
//   repository_id: {
//     type: Sequelize.BIGINT
//   },
//   team_id: {
//     type: Sequelize.STRING
//   },
//   channel_id: {
//     type: Sequelize.STRING
//   },
// }, {
//   underscored: true,
// });
//
// Subscription.sync({force: true})
//
// module.exports = {
//   async subscribe(subscription) {
//   },
//
//   async lookup(conditions) {
//     return Subscription.findAll({where: conditions})
//   }
// }
/**
 * This module is responsible for figuring out which channels to route
 * notifications from GitHub.
 */

const { promisify } = require('util');
// FIXME: move these to some global app setup and inject storage dependency
const redis = require('redis');

const client = redis.createClient(process.env.REDIS_URL);

function key(resource) {
  return `subscription:${resource}`;
}

module.exports = {
  async lookup(resource) {
    return promisify(client.smembers).bind(client)(key(resource));
  },

  async subscribe(resource, target) {
    return promisify(client.sadd).bind(client)(key(resource), target);
  },

  async unsubscribe(resource, target) {
    return promisify(client.srem).bind(client)(key(resource), target);
  },

  async reset() {
    const keys = await promisify(client.keys).bind(client)(key('*'));
    if (keys.length > 0) {
      return promisify(client.del).bind(client)(...keys);
    }
  },
};
