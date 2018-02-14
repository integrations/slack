module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addConstraint('LegacySubscriptions', [
      'workspaceSlackId',
      'repoGitHubId',
      'channelSlackId',
      'serviceSlackId',
    ], {
      type: 'unique',
      name: 'LegacySubscriptionsUniqueConstraint',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeConstraint('LegacySubscriptions', 'LegacySubscriptionsUniqueConstraint');
  },
};
