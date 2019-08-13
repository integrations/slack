const { GitHubUser } = require('../models');

const createDeploymentDialog = require('../messages/create/create-deployment-dialog');
const DeploymentList = require('../messages/deployment-list');
const addState = require('../dialogs/add-state');

/**
 * Manages deployments
 *
 * Usage:
 *   /github deploy
 */
async function open(req, res) {
  const { resource, gitHubUser, slackWorkspace } = res.locals;
  const { command } = res.locals;

  const { owner, repo } = resource;

  const [{ data: repository }, { data: branches }, { data: tags }] = await Promise.all([
    gitHubUser.client.repos.get({ owner, repo }),
    gitHubUser.client.repos.listBranches({ owner, repo }),
    gitHubUser.client.request('GET /repos/:owner/:repo/git/refs/tags', { owner, repo }),
  ]);
  const { trigger_id } = req.body;
  const dialog = createDeploymentDialog({ repository, branches, tags });
  await slackWorkspace.client.dialog.open({
    dialog: addState(dialog, command.channel_id, resource),
    trigger_id,
  });

  return command.respond();
}

async function createDeployment(slackUser, submission, owner, repo) {
  const {
    ref, environment, task, payload,
  } = submission;
  const deployment = await slackUser.GitHubUser.client.repos.createDeployment({
    owner,
    repo,
    ref,
    environment: environment || undefined,
    task: task || undefined,
    payload: payload || undefined,
  });
  const nodeId = deployment.data.node_id;

  const query = `
   query {
     node(id: "${nodeId}") {
       ... on Deployment {
         creator {
           login,
           url
         },
         ref {
           name
         },
         commit {
           message,
           abbreviatedOid,
           commitUrl
         },
         description,
         task,
         environment,
         state,
         createdAt,
         latestStatus {
           state,
           description
         }
       }
     }
   }`;

  const { data } = await slackUser.GitHubUser.client.request({
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
    method: 'POST',
    url: '/graphql',
    query,
  });
  return data.data.node;
}

async function submit(req, res) {
  const { slackUser } = res.locals;

  await slackUser.reload({ include: [GitHubUser] });
  const { repository } = req.body.submission;
  const { data } = await slackUser.GitHubUser.client.request('GET /repositories/:id', {
    id: repository,
  });
  const owner = data.owner.login;
  const repo = data.name;
  const deployment = await createDeployment(slackUser, req.body.submission, owner, repo);
  const slack = res.locals.slackWorkspace.client;
  await slack.chat.postMessage({
    channel: res.locals.channel,
    ...new DeploymentList([deployment], { owner, repo }).toJSON(),
  });

  return res.send();
}

module.exports = {
  open,
  submit,
};
