module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addIndex('Installations', {
      fields: ['githubId'],
      name: 'installations_github_id',
    });
    await queryInterface.addIndex('Installations', {
      fields: ['ownerId'],
      name: 'installations_owner_id',
    });
    await queryInterface.addIndex('SlackWorkspaces', {
      fields: ['slackId'],
      name: 'slack_workspaces_slack_id',
    });
    await queryInterface.addIndex('SlackUsers', {
      fields: ['slackId', 'slackWorkspaceId'],
      name: 'slack_users_slack_id_workspace_id',
    });
    await queryInterface.addIndex('Subscriptions', {
      fields: ['githubId'],
      name: 'subscriptions_github_id',
    });
    await queryInterface.addIndex('Subscriptions', {
      fields: ['githubId', 'channelId', 'slackWorkspaceId'],
      name: 'subscriptions_github_id_channel_id_workspace_id',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('Installations', 'installations_github_id');
    await queryInterface.removeIndex('Installations', 'installations_owner_id');
    await queryInterface.removeIndex('SlackWorkspaces', 'slack_workspaces_slack_id');
    await queryInterface.removeIndex('SlackUsers', 'slack_users_slack_id_workspace_id');
    await queryInterface.removeIndex('Subscriptions', 'subscriptions_github_id');
    await queryInterface.removeIndex('Subscriptions', 'subscriptions_github_id_channel_id_workspace_id');
  },
};
