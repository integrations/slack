
module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('GitHubUsers', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.BIGINT,
    },
    githubId: {
      type: Sequelize.BIGINT,
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
      unique: true,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
  }),
  down: queryInterface => queryInterface.dropTable('GitHubUsers'),
};
