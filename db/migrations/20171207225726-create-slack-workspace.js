
module.exports = {
  up: (queryInterface, Sequelize) => {
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
    });

    queryInterface.addColumn('SlackUsers', 'slackWorkspaceId', {
      type: Sequelize.BIGINT,
      // FIXME: uncomment once everything else is actually implmented
      // allowNull: false,
    });

    queryInterface.addConstraint('SlackUsers', ['slackId', 'slackWorkspaceId'],
      {
        type: 'unique',
        name: 'userWorkspaceUniqueConstraint',
      },
    );
  },
  down: (queryInterface) => {
    // queryInterface.removeConstraint('SlackUsers', 'userWorkspaceUniqueConstraint');
    queryInterface.removeColumn('SlackUsers', 'slackWorkspaceId');
    queryInterface.dropTable('SlackWorkspaces');
  },
};
