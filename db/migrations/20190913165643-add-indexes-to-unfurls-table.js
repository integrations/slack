module.exports = {
  up: (queryInterface) => Promise.all([
    queryInterface.addIndex('Unfurls', {
      fields: ['channelSlackId'],
      name: 'unfurls_channel_slack_id',
    }),
    queryInterface.addIndex('Unfurls', {
      fields: ['slackWorkspaceId'],
      name: 'unfurls_slack_workspace_id',
    }),
    queryInterface.addIndex('Unfurls', {
      fields: ['slackUserId'],
      name: 'unfurls_slack_user_id',
    }),
    queryInterface.addIndex('Unfurls', {
      fields: ['githubRepoId'],
      name: 'unfurls_github_repo_id',
    }),
  ]),
  down: (queryInterface) => Promise.all([
    queryInterface.removeIndex('Unfurls', 'unfurls_channel_slack_id'),
    queryInterface.removeIndex('Unfurls', 'unfurls_slack_workspace_id'),
    queryInterface.removeIndex('Unfurls', 'unfurls_slack_user_id'),
    queryInterface.removeIndex('Unfurls', 'unfurls_github_repo_id'),
  ]),
};
