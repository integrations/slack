const logger = require('probot/lib/logger');
const models = require('../../lib/models');

const { LegacySubscription } = models({ logger });

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('LegacySubscriptions', 'serviceSlackId', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    const allLegacySubscriptions = await LegacySubscription.findAll();
    await Promise.all(allLegacySubscriptions.map((legacySubscription) => {
      // eslint-disable-next-line no-param-reassign
      legacySubscription.serviceSlackId = legacySubscription.originalSlackConfiguration.id;
      return legacySubscription.save();
    }));
    await queryInterface.changeColumn('LegacySubscriptions', 'serviceSlackId', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('LegacySubscriptions', 'serviceSlackId');
  },
};
