module.exports = {
  up: async (queryInterface) => {
    await queryInterface.removeColumn('GitHubUsers', 'accessToken');
    await queryInterface.removeColumn('SlackWorkspaces', 'accessToken');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('GitHubUsers', 'accessToken', Sequelize.STRING);
    await queryInterface.addColumn('SlackWorkspaces', 'accessToken', Sequelize.STRING);
  },
};
