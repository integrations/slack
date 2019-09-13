module.exports = {
  up: (queryInterface) => Promise.all([
    queryInterface.addIndex('Unfurls', {
      fields: ['channelSlackId', 'slackWorkspaceId', 'slackUserId', 'githubRepoId'],
      name: 'unfurls_channel_slack_id_slack_workspace_id_slack_user_id_github_repo_id',
    }),
  ]),
  down: (queryInterface) => Promise.all([
    queryInterface.removeIndex('Unfurls', 'unfurls_channel_slack_id_slack_workspace_id_slack_user_id_github_repo_id'),
  ]),
};
