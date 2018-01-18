module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Subscriptions', 'creatorId', {
      type: Sequelize.BIGINT,
      allowNull: true,
      references: {
        model: 'SlackUsers',
        key: 'id',
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('Subscriptions', 'creatorId');
  },
};
