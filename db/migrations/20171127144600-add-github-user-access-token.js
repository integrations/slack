
module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.addColumn('GitHubUsers',
    'accessToken',
    {
      type: Sequelize.STRING,
      allowNull: false,
    },
  ),
  down: queryInterface => queryInterface.removeColumn('GitHubUsers', 'accessToken'),
};
