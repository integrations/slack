module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('DeletedSubscriptions', {
    id: {
      allowNull: false,
      primaryKey: true,
      type: Sequelize.BIGINT,
    },
    githubId: {
      allowNull: false,
      type: Sequelize.BIGINT,
    },
    channelId: {
      allowNull: false,
      type: Sequelize.STRING,
    },
    type: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'repo',
    },
    slackWorkspaceId: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    installationId: {
      type: Sequelize.BIGINT,
      allowNull: true,
      hooks: true,
    },
    creatorId: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    settings: {
      type: Sequelize.JSON,
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
    reason: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    deletedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },
  }),
  down: queryInterface => queryInterface.dropTable('DeletedSubscriptions'),
};
