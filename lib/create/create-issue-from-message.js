const axios = require('axios');
const IssueCreated = require('../messages/create/create-issue-attachment');
const dialogs = require('../dialogs');

async function openDialog(req, res) {
  const { slackWorkspace } = res.locals;
  const {
    trigger_id, team, channel, message,
  } = req.body;

  await slackWorkspace.client.dialog.open({
    dialog: dialogs.createIssue(message, channel, team),
    trigger_id,
  });

  return res.send();
}

async function getUserRepos(req, res) {
  const { slackUser } = res.locals;

  const query = `
      query {
        viewer {
          repositories(first: 30, orderBy: {field: UPDATED_AT, direction: DESC}) {
            totalCount
            nodes {
              id
              databaseId
              isPrivate
              name
              owner {
                id
              }
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
  const { repositories } = data.data.viewer;

  const options = repositories.nodes.map(repo => ({
    label: repo.name,
    value: repo.databaseId,
  }));

  return res.send({ options });
}

async function createIssueFromDialog(req, res) {
  const { slackUser } = res.locals;

  const { title, body, repository } = req.body.submission;
  const { response_url } = req.body;
  let repos;
  try {
    repos = await slackUser.GitHubUser.client.repos.getById({ id: repository });
  } catch (e) {
    const errorMessage = JSON.parse(e.message).message;
    return res.send({
      errors: [
        {
          name: 'repository',
          error: errorMessage,
        },
      ],
    });
  }

  const owner = repos.data.owner.login;
  const repo = repos.data.name;
  let createdIssue;
  try {
    createdIssue = await slackUser.GitHubUser.client.issues.create({
      owner,
      repo,
      title,
      body,
    });
  } catch (e) {
    const errorMessage = JSON.parse(e.message).message;
    return res.send({
      errors: [
        {
          name: 'repository',
          error: errorMessage,
        },
      ],
    });
  }

  await axios.post(response_url, {
    response_type: 'ephemeral',
    attachments: IssueCreated(createdIssue),
  });

  return res.send();
}

module.exports = {
  openDialog,
  getUserRepos,
  createIssueFromDialog,
};
