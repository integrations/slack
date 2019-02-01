module.exports = {
  up: async (queryInterface, Sequelize) => {
		await queryInterface.addColumn('Subscriptions', 'type', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'repo',
		});
  },
  down: async queryInterface => {
		await queryInterface.removeColumn('Subscriptions', 'type');
	},
};
