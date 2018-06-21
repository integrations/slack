const {
  GitHubUser,
} = require('../models');

const createIssueDialog = require('../messages/create/create-issue-dialog');

async function open(req, res) {
  const {
    command,
    gitHubUser,
    slackWorkspace,
    resource,
  } = res.locals;

  const { owner, repo } = resource;
  const [{ data: repository }, { data: labels }] = await Promise.all([
    gitHubUser.client.repos.get({ owner, repo }),
    gitHubUser.client.issues.getLabels({ owner, repo }),
  ]);

  const { trigger_id } = req.body;
  await slackWorkspace.client.dialog.open({
    dialog: createIssueDialog({ repository, labels }),
    trigger_id,
  });

  return command.respond();
}

async function submit(req, res) {
  const { slackUser } = res.locals;

  const { title, body, label } = req.body.submission;
  const { repository } = req.body.submission;

  await slackUser.reload({ include: [GitHubUser] });
  const { data } = await slackUser.GitHubUser.client.repos.getById({ id: repository });
  const owner = data.owner.login;
  const repo = data.name;
  const { data: labels } = await slackUser.GitHubUser.client.issues.getLabels({ owner, repo });
  await slackUser.GitHubUser.client.issues.create({
    owner,
    repo,
    title,
    body,
    labels: labels.filter(({ id }) => id === Number(label)),
  });

  return res.send();
}

module.exports = {
  open,
  submit,
};
