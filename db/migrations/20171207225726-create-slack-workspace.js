
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('SlackWorkspaces', {
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

    await queryInterface.addColumn('SlackUsers', 'slackWorkspaceId', {
      type: Sequelize.BIGINT,
    });

    await queryInterface.addConstraint('SlackUsers', ['slackId', 'slackWorkspaceId'], {
      type: 'unique',
      name: 'userWorkspaceUniqueConstraint',
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeConstraint('SlackUsers', 'userWorkspaceUniqueConstraint');
    await queryInterface.removeColumn('SlackUsers', 'slackWorkspaceId');
    await queryInterface.dropTable('SlackWorkspaces');
  },
};
