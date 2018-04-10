module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Unfurls', 'githubRepoId', {
      type: Sequelize.BIGINT,
      allowNull: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('Unfurls', 'githubRepoId');
  },
};
