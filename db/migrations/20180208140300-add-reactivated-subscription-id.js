module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('LegacySubscriptions', 'reactivatedSubscriptionId', {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: {
        model: 'Subscriptions',
        key: 'id',
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('LegacySubscriptions', 'reactivatedSubscriptionId');
  },
};
