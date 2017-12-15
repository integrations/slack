

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Subscriptions', 'slackWorkspaceId', {
      type: Sequelize.BIGINT,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('Subscriptions', 'slackWorkspaceId');
  },
};
