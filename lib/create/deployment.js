const {
  GitHubUser,
} = require('../models');

const createDeploymentDialog = require('../messages/create/create-deployment-dialog');
const addState = require('../dialogs/add-state');

async function getTags(gitHubUser, owner, repo) {
  try {
    return await gitHubUser.client.gitdata.getTags({ owner, repo });
  } catch (err) {
    if (err.code === 404) {
      console.log('No tags found for repository', { err });
      return { data: [] };
    }
    throw err;
  }
}

/**
 * Manages deployments
 *
 * Usage:
 *   /github deploy
 */
async function open(req, res) {
  const {
    resource, gitHubUser, slackWorkspace,
  } = res.locals;
  const { command } = res.locals;

  const { owner, repo } = resource;

  const [{ data: repository }, { data: branches }, { data: tags }] = await Promise.all([
    gitHubUser.client.repos.get({ owner, repo }),
    gitHubUser.client.repos.listBranches({ owner, repo }),
    getTags(gitHubUser, owner, repo),
  ]);

  const { trigger_id } = req.body;
  const dialog = createDeploymentDialog({ repository, branches, tags });
  await slackWorkspace.client.dialog.open({
    dialog: addState(dialog, command.channel_id, resource),
    trigger_id,
  });

  return command.respond();
}

async function submit(req, res) {
  const { slackUser } = res.locals;

  const {
    repository, ref, environment, task, payload,
  } = req.body.submission;

  await slackUser.reload({ include: [GitHubUser] });

  const { data } = await slackUser.GitHubUser.client.repos.getById({ id: repository });
  const owner = data.owner.login;
  const repo = data.name;

  await slackUser.GitHubUser.client.repos.createDeployment({
    owner,
    repo,
    ref,
    environment: environment || undefined,
    task: task || undefined,
    payload: payload || undefined,
  });

  return res.send();
}

module.exports = {
  open,
  submit,
};
