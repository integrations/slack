const githubUrl = require('../github-url');
const { Subscription } = require('../models');

async function isRepoSubscribed(channelId, workspaceId, repoId) {
  const subscription = await Subscription.findOne({
    where: {
      slackWorkspaceId: workspaceId,
      channelId,
      githubId: repoId,
    },
  });
  return !!subscription;
}

module.exports = async (repoUnfurl, slackUser, slackWorkspace, channelId) => {
  const { owner, repo } = githubUrl(repoUnfurl.url);
  const github = slackUser.GitHubUser.client;
  const repository = (await github.repos.get({ owner, repo })).data;

  const message = {
    title: repository.full_name,
    fallback: `Open Slack to take action on ${repository.full_namel}`,
    callback_id: 'quick-action',
    actions: [],
  };
  if (await isRepoSubscribed(channelId, slackWorkspace.id, repository.id)) {
    message.actions.push({
      name: 'unsubscribe',
      text: 'Unsubscribe',
      type: 'button',
      value: `repo-${repository.id}`,
    });
  } else {
    message.actions.push({
      name: 'subscribe',
      text: 'Subscribe',
      type: 'button',
      value: `repo-${repository.id}`,
    });
  }

  return message;
};
