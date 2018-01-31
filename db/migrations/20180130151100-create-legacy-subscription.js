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
        allowNull: false,
      },
      repoGitHubId: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      repoFullName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      authorSlackId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      channelSlackId: {
        type: Sequelize.STRING,
        allowNull: false,
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
