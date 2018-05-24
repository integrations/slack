const githubUrl = require('../github-url');
const { GitHubUser } = require('../models');

async function attachToIssueFromMessage(req, res) {
  const { slackWorkspace } = res.locals;
  // What do we want to do here?
  // When user clicks this action, we present them with a dialog
  // The dialog requires them to paste an issue URL (maybe at some point we can make that a search bar?)
  // They can also preview the comment that will be posted
  // Create comment submit label

  // If they're not logged in at this stage, we should get them through the
  // GitHub OAuth flow and then present tham with a button in the "completed log in"
  // message which re-triggers what they wanted to do previously

  // If there's a link to an issue or pr in the message we should parse that
  // and auto-fill it in this dialog

  const {
    trigger_id,
    team,
    channel,
    message,
  } = req.body;
  const linkToMessage =
    `${team.domain}.slack.com/archives/${channel.id}/p${message.ts.replace('.', '')}`;
  const comment = `> ${message.text}\n<sub>[View message in Slack](${linkToMessage})</sub>`;
  await slackWorkspace.client.dialog.open({
    dialog: {
      callback_id: 'add-comment',
      title: 'Comment on Issue or PR',
      submit_label: 'Comment',
      elements: [
        {
          type: 'text',
          subtype: 'url',
          label: 'Issue or PR URL',
          placeholder: 'https://github.com/atom/atom/issues/1',
          name: 'url',
        },
        {
          type: 'textarea',
          label: 'Comment',
          name: 'comment',
          value: comment,
        },
      ],
    },
    trigger_id,
  });

  return res.send();
}

async function createCommentFromDialog(req, res) {
  res.send();
  const { slackUser } = res.locals;
  // Expects dialog submission like the one sent in `attachToIssueFromMessage`


  const { url, comment } = req.body.submission;

  const resource = githubUrl(url);
  if (!(resource.type === 'issue' || resource.type === 'pull')) {
    res.send('// Looks like the URL you entered is incorrect. want to try again?');
  }

  // Make sure that GitHub app has
  // necessary permissions and fails gracefully here
  await slackUser.reload({ include: [GitHubUser] });
  const { data } = await slackUser.GitHubUser.client.issues.createComment({
    ...resource,
    type: undefined,
    body: comment,
  });
  // return res.json({
  //   response_type: 'ephemeral',
  //   attachments: [{
  //     text: `:white_check_mark: Comment created ${data.html_url}`,
  //   }],
  // });
}

module.exports = {
  createCommentFromDialog,
  attachToIssueFromMessage,
};
