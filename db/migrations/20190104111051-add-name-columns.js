module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Subscriptions', 'githubName', {
      type: Sequelize.STRING,
    });
    await queryInterface.addColumn('GitHubUsers', 'login', {
      type: Sequelize.STRING,
    });
    await queryInterface.addColumn('DeletedSubscriptions', 'githubName', {
      type: Sequelize.STRING,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Subscriptions', 'githubName');
    await queryInterface.removeColumn('GitHubUsers', 'login');
    await queryInterface.removeColumn('DeletedSubscriptions', 'githubName');
  }
};
