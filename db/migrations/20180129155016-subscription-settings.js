module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Subscriptions', 'settings', Sequelize.JSON);
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('Subscriptions', 'settings');
  },
};
