module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('SlackUsers', 'slackWorkspaceId', {
      type: Sequelize.BIGINT,
      allowNull: false,
    });

    await queryInterface.changeColumn('Subscriptions', 'slackWorkspaceId', {
      type: Sequelize.BIGINT,
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('SlackUsers', 'slackWorkspaceId', {
      type: Sequelize.BIGINT,
    });

    await queryInterface.changeColumn('Subscriptions', 'slackWorkspaceId', {
      type: Sequelize.BIGINT,
    });
  },
};
