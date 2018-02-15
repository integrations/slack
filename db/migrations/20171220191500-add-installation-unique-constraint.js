module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addConstraint('Installations', ['githubId', 'ownerId'], {
      type: 'unique',
      name: 'installationOwnerUniqueConstraint',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('Installations', 'installationOwnerUniqueConstraint');
  },
};
