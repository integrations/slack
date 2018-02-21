module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('GitHubUsers', 'secrets', Sequelize.BLOB);

    // TODO: migrate data

    await queryInterface.removeColumn('GitHubUsers', 'accessToken');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('GitHubUsers', 'accessToken', Sequelize.TEXT);

    // TODO: migrate data

    await queryInterface.removeColumn('GitHubUsers', 'secrets');
  },
};
