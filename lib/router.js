const Sequelize = require('sequelize');
const sequelize = new Sequelize('postgres://localhost:5432/slack-dev');

const Subscription = sequelize.define('subscription', {
  account_id: {
    type: Sequelize.BIGINT,
    allowNull: false
  },
  repository_id: {
    type: Sequelize.BIGINT
  },
  team_id: {
    type: Sequelize.STRING
  },
  channel_id: {
    type: Sequelize.STRING
  },
}, {
  underscored: true,
});

Subscription.sync({force: true})

module.exports = {
  async subscribe(subscription) {
  },

  async lookup(conditions) {
    return Subscription.findAll({where: conditions})
  }
}
