

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Subscriptions', 'slackWorkspaceId', {
      type: Sequelize.BIGINT,
      allowNull: false,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('Subscriptions', 'slackWorkspaceId');
  },
};
