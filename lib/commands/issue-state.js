const Channel = require('../slack/channel');
const cache = require('../cache');
const { Issue } = require('../messages/issue');

module.exports = state => async (req, res) => {
  const { gitHubUser, slackWorkspace, command } = res.locals;
  const { owner, repo, number } = res.locals.resource;

  const channel = new Channel({
    id: command.channel_id,
    workspaceId: slackWorkspace.id,
    cache,
    client: slackWorkspace.client,
    logger: req.log,
  });

  const { data: repository } = await gitHubUser.client.repos.get({ owner, repo });
  const { data: sender } = await gitHubUser.client.users.get({});
  const { data: issue } = await gitHubUser.client.issues.edit({
    owner,
    repo,
    number,
    state,
    headers: { accept: 'application/vnd.github.html+json' },
  });

  await command.respond({ response_type: 'in_channel' });

  const message = new Issue({
    issue,
    sender,
    repository,
    eventType: `issues.${state === 'open' ? 'reopened' : 'closed'}`,
  });

  return channel.rollup(message, { forceNew: true });
};
