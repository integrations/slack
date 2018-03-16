module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('GitHubUsers', 'secrets', Sequelize.BLOB);
    await queryInterface.addColumn('SlackWorkspaces', 'secrets', Sequelize.BLOB);

    // TODO: migrate data

    await queryInterface.removeColumn('GitHubUsers', 'accessToken');
    await queryInterface.removeColumn('SlackWorkspaces', 'accessToken');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('GitHubUsers', 'accessToken', Sequelize.TEXT);
    await queryInterface.addColumn('SlackWorkspaces', 'accessToken', Sequelize.TEXT);

    // TODO: migrate data

    await queryInterface.removeColumn('GitHubUsers', 'secrets');
    await queryInterface.removeColumn('SlackWorkspaces', 'secrets');
  },
};
