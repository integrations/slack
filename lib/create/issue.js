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

  let template = '';
  try {
    const { data: templates } = await gitHubUser.client.repos.getContent({ owner, repo, path: '.github/ISSUE_TEMPLATE' });
    if (templates.length > 0) {
      const { path } = templates[0]; // how do we let the user if there's more than one?
      const content = await gitHubUser.client.repos.getContent({ owner, repo, path });
      template = Buffer.from(content.data.content, 'base64').toString();
    }
  } catch (err) {
    if (err.code !== 404) throw err;
  }

  const { trigger_id } = req.body;
  await slackWorkspace.client.dialog.open({
    dialog: createIssueDialog({ repository, labels, template }),
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
  const labels = [].concat(label).filter(Boolean);

  await slackUser.GitHubUser.client.issues.create({
    owner,
    repo,
    title,
    body,
    labels,
  });

  return res.send();
}

module.exports = {
  open,
  submit,
};
