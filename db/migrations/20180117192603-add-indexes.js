module.exports = {
  up: (queryInterface) => {
    queryInterface.addIndex('Installations', {
      fields: ['githubId'],
      name: 'installations_github_id',
    });
    queryInterface.addIndex('Installations', {
      fields: ['ownerId'],
      name: 'installations_owner_id',
    });
    queryInterface.addIndex('SlackWorkspaces', {
      fields: ['slackId'],
      name: 'slack_workspaces_slack_id',
    });
    queryInterface.addIndex('SlackUsers', {
      fields: ['slackId', 'slackWorkspaceId'],
      name: 'slack_users_slack_id_workspace_id',
    });
    queryInterface.addIndex('Subscriptions', {
      fields: ['githubId'],
      name: 'subscriptions_github_id',
    });
    queryInterface.addIndex('Subscriptions', {
      fields: ['githubId', 'channelId', 'slackWorkspaceId'],
      name: 'subscriptions_github_id_channel_id_workspace_id',
    });
  },

  down: (queryInterface) => {
    queryInterface.removeIndex('Installations', 'installations_github_id');
    queryInterface.removeIndex('Installations', 'installations_owner_id');
    queryInterface.removeIndex('SlackWorkspaces', 'slack_workspaces_slack_id');
    queryInterface.removeIndex('SlackUsers', 'slack_users_slack_id_workspace_id');
    queryInterface.removeIndex('Subscriptions', 'subscriptions_github_id');
    queryInterface.removeIndex('Subscriptions', 'subscriptions_github_id_channel_id_workspace_id');
  },
};
