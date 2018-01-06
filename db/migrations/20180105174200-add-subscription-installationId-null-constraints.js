module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Subscriptions', 'installationId', {
      type: Sequelize.BIGINT,
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Subscriptions', 'installationId', {
      type: Sequelize.BIGINT,
      allowNull: true,
    });
  },
};
