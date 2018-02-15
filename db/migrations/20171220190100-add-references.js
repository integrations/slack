module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('SlackUsers', 'slackWorkspaceId', {
      type: Sequelize.BIGINT,
      allowNull: false,
      references: {
        model: 'SlackWorkspaces',
        key: 'id',
      },
    });

    await queryInterface.changeColumn('SlackUsers', 'githubId', {
      type: Sequelize.BIGINT,
      references: {
        model: 'GitHubUsers',
        key: 'id',
      },
    });

    await queryInterface.changeColumn('Subscriptions', 'slackWorkspaceId', {
      type: Sequelize.BIGINT,
      allowNull: false,
      references: {
        model: 'SlackWorkspaces',
        key: 'id',
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('SlackUsers', 'slackWorkspaceId', {
      type: Sequelize.BIGINT,
      allowNull: false,
    });

    await queryInterface.changeColumn('SlackUsers', 'githubId', {
      type: Sequelize.BIGINT,
    });

    await queryInterface.changeColumn('Subscriptions', 'slackWorkspaceId', {
      type: Sequelize.BIGINT,
      allowNull: false,
    });
  },
};
