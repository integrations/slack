/**
 * Subscribes a slack channel to activity from an Organization or Repository
 *
 * Usage:
 *   /github subscribe org/repo
 *   /github subscribe org
 */
module.exports = (command) => {
  // Organization, Repository, and message type that user would be subscribing to:
  // - orgname
  // - orgname/repo
  // - orgname/repo types
  const topic = await resolveToTopic(command.text)


  const subscription = await router.subscribe(topic, channel)

  /*
  TODO:
  - [ ] associate Slack user => GitHub identity
    User mapping:
      github_installation_id, github_user_id, github_token, slack_user_id, slack_team_id,
  - [ ] install GitHub App
  - [ ] Persist routing for channel
    Routing:
      account_id, repo_id?, channel_id, team_id
  - [ ] confirmation "ok, this channel is subcribed to foo/bar"
  */
};
