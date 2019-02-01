
module.exports = {
  up: async (queryInterface, Sequelize) => {
		await queryInterface.addColumn('GitHubUsers', 'accessToken', {
      type: Sequelize.STRING,
      allowNull: false,
    });
	},
  down: async queryInterface => {
		await queryInterface.removeColumn('GitHubUsers', 'accessToken');
	},
};
