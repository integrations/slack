module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Unfurls', 'slackUserId', {
      type: Sequelize.BIGINT,
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Unfurls', 'slackUserId', {
      type: Sequelize.BIGINT,
      allowNull: true,
    });
  },
};
