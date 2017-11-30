
module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('Installations', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.BIGINT,
    },
    githubId: {
      type: Sequelize.BIGINT,
    },
    ownerId: {
      type: Sequelize.BIGINT,
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
  down: queryInterface => queryInterface.dropTable('Installations'),
};
