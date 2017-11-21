
module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('SlackUsers', {
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
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
    userId: {
      type: Sequelize.BIGINT,
      references: {
        model: 'Users',
        key: 'id',
        as: 'userId',
      },
    },
  }),
  down: queryInterface => queryInterface.dropTable('SlackUsers'),
};
