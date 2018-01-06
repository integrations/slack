module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Installations', 'githubId', {
      type: Sequelize.BIGINT,
      allowNull: false,
    });

    await queryInterface.changeColumn('Installations', 'ownerId', {
      type: Sequelize.BIGINT,
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Installations', 'githubId', {
      type: Sequelize.BIGINT,
    });

    await queryInterface.changeColumn('Installations', 'ownerId', {
      type: Sequelize.BIGINT,
    });
  },
};
