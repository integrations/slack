
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
    userSlackId: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    githubType: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    isCondensed: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
    },
    isPublic: {
      type: Sequelize.BOOLEAN,
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
  }),
  down: queryInterface => queryInterface.dropTable('Unfurls'),
};
