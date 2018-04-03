
module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('Unfurls', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.BIGINT,
    },
    url: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    channelSlackId: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    githubType: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    isCondensed: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
    },
    isPublic: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
    },
    isDelivered: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
    },
    slackMessageTimestamp: {
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
    slackWorkspaceId: {
      type: Sequelize.BIGINT,
      allowNull: false,
      references: {
        model: 'SlackWorkspaces',
        key: 'id',
      },
    },
    slackUserId: {
      type: Sequelize.BIGINT,
      allowNull: false,
      references: {
        model: 'SlackUsers',
        key: 'id',
      },
    },
  }),
  down: queryInterface => queryInterface.dropTable('Unfurls'),
};
