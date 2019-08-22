
module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
    queryInterface.createTable('SlackWorkspaces', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT,
      },
      slackId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      accessToken: {
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
    }),

    queryInterface.addColumn('SlackUsers', 'slackWorkspaceId', {
      type: Sequelize.BIGINT,
    }),

    queryInterface.addConstraint('SlackUsers', ['slackId', 'slackWorkspaceId'],
      {
        type: 'unique',
        name: 'userWorkspaceUniqueConstraint',
      },
    ),
    ]);
  },
  down: (queryInterface) => {
    return Promise.all([
    queryInterface.removeConstraint('SlackUsers', 'userWorkspaceUniqueConstraint'),
    queryInterface.removeColumn('SlackUsers', 'slackWorkspaceId'),
    queryInterface.dropTable('SlackWorkspaces'),
    ]);
  },
};
