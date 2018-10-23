module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.addColumn('Subscriptions',
    'type',
    {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'repo',
    },
  ),
  down: queryInterface => queryInterface.removeColumn('Subscriptions', 'type'),
};
