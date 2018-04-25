const {
  SlackWorkspace,
  SlackUser,
  GitHubUser,
  Subscription,
} = require('../models');

async function openDialog(req, res) {
  const {
    command,
    gitHubUser,
    slackWorkspace,
  } = res.locals;

  const subscriptions = await Subscription.findAll({
    where: { channelId: req.body.channel_id, slackWorkspaceId: slackWorkspace.id },
  });
  if (subscriptions.length === 0) {
    return command.respond({ text: 'This channel is not subscribed to any repositories' });
  }

  let repositories = await Promise.all(subscriptions.map(async (subscription) => {
    const github = gitHubUser.client;
    try {
      const repository = await github.repos.getById({ id: subscription.githubId });
      return repository.data;
    } catch (err) {
      req.log.error({ err, repoId: subscription.githubId }, 'Could not find repository for subscription');
      if (err.code !== 404) {
        throw err;
      }
    }
  }));
  // remove undefined
  repositories = repositories.filter(repo => repo);

  // Should this just pre-fill the GitHub issue?
  let dialog;
  if (repositories.length === 1) {
    dialog = {
      callback_id: 'create-issue-dialog',
      title: 'Open new issue', /* `Open new issue on ${repositories[0].full_name}`, */
      submit_label: 'Open',
      elements: [
        {
          type: 'text',
          label: 'Title',
          name: 'title',
          hint: `The issue will be opened on ${repositories[0].full_name}`,
        },
        {
          type: 'textarea',
          label: 'Write',
          name: 'body',
          placeholder: 'Leave a comment',
          hint: 'GitHub markdown syntax is supported, although you cannot preview it in Slack.',
        },
      ],
    };
  } else {
    dialog = {
      callback_id: 'create-issue-dialog',
      title: 'Open new issue',
      submit_label: 'Open',
      elements: [
        {
          label: 'Repository',
          type: 'select',
          name: 'repository',
          placeholder: 'Select the repository on which to open the issue',
          options: repositories.map(repository => ({
            label: repository.full_name,
            value: repository.id,
          })),
        },
        {
          type: 'text',
          label: 'Title',
          name: 'title',
        },
        {
          type: 'textarea',
          label: 'Write',
          name: 'body',
          optional: true,
          placeholder: 'Leave a comment',
          hint: 'GitHub markdown syntax is supported, although you cannot preview it in Slack.',
        },
      ],
    };
  }

  const { trigger_id } = req.body;
  await slackWorkspace.client.dialog.open({ dialog, trigger_id });

  return command.respond();
}

async function dialogSubmit(req, res) {
  const { slackUser, slackWorkspace } = res.locals;

  const { title, body } = req.body.submission;
  let { repository } = req.body.submission;

  if (!repository) {
    const subscription = await Subscription.findOne({
      where: { channelId: req.body.channel.id, slackWorkspaceId: slackWorkspace.id },
    });
    repository = subscription.githubId;
  }
  await slackUser.reload({ include: [GitHubUser] });
  const { data } = await slackUser.GitHubUser.client.repos.getById({ id: repository });
  const owner = data.owner.login;
  const repo = data.name;
  await slackUser.GitHubUser.client.issues.create({
    owner,
    repo,
    title,
    body,
  });

  return res.send();
}


module.exports = {
  openDialog,
  dialogSubmit,
};
