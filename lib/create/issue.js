const {
  GitHubUser,
} = require('../models');

const createIssueDialog = require('../messages/create/create-issue-dialog');
const addState = require('../dialogs/add-state');

async function getTemplateContent(gitHubUser, owner, repo, template) {
  const { path } = template; // how do we let the user if there's more than one?
  const content = await gitHubUser.client.repos.getContents({ owner, repo, path });
  return Buffer.from(content.data.content, 'base64').toString();
}

async function loadTemplate(gitHubUser, owner, repo, command) {
  try {
    const { data: templates } = await gitHubUser.client.repos.getContents({ owner, repo, path: '.github/ISSUE_TEMPLATE' });
    if (templates.length === 1) {
      return await getTemplateContent(gitHubUser, owner, repo, templates[0]);
    } else if (templates.length > 1) {
      const name = command.args[0];
      const match = name && templates.find(tmpl => tmpl.name.includes(name));
      if (!match) {
        const templateNames = templates.map(tmpl => `\`${tmpl.name}\``).join(', ');
        command.respond({
          response_type: 'ephemeral',
          text: `Indicate which template you want to use: \`/github ${owner}/${repo} <template-name>\`. These templates were found: ${templateNames}`,
        });
        return null;
      }
      return await getTemplateContent(gitHubUser, owner, repo, match);
    }
  } catch (err) {
    if (err.code !== 404) throw err;
  }
  return '';
}

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
    gitHubUser.client.issues.listLabelsForRepo({ owner, repo }),
  ]);

  const template = await loadTemplate(gitHubUser, owner, repo, command);
  if (template === null) return; // command already responded

  const { trigger_id } = req.body;
  const dialog = createIssueDialog({ repository, labels, template });
  await slackWorkspace.client.dialog.open({
    dialog: addState(dialog, command.channel_id, resource),
    trigger_id,
  });

  return command.respond();
}

async function submit(req, res) {
  const { slackUser } = res.locals;

  const { title, body, label } = req.body.submission;
  const { repository } = req.body.submission;

  await slackUser.reload({ include: [GitHubUser] });

  const { data } = await slackUser.GitHubUser.client.request('GET /repositories/:id', { id: repository });
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
