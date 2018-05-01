module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('SlackUsers', 'settings', Sequelize.JSON);
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('SlackUsers', 'settings');
  },
};
