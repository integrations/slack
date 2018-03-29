module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('GitHubUsers', 'secrets', Sequelize.BLOB);
    await queryInterface.addColumn('SlackWorkspaces', 'secrets', Sequelize.BLOB);
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('GitHubUsers', 'secrets');
    await queryInterface.removeColumn('SlackWorkspaces', 'secrets');
  },
};
