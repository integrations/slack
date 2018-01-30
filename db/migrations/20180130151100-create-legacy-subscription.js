module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('LegacySubscriptions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      workspaceSlackId: {
        type: Sequelize.STRING,
      },
      repoGitHubId: {
        type: Sequelize.BIGINT,
      },
      repoFullName: {
        type: Sequelize.STRING,
      },
      authorSlackId: {
        type: Sequelize.STRING,
      },
      channelSlackId: {
        type: Sequelize.STRING,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('LegacySubscriptions');
  },
};
