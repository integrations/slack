const axios = require('axios');

const githubUrl = require('../github-url');
const DialogSubmissionError = require('../messages/create/dialog-submission-error');
const CommentCreated = require('../messages/create/comment-created');

async function attachToIssueFromMessage(req, res) {
  const { slackWorkspace } = res.locals;

  // Would be cool to present user with a way to search for issues

  const {
    trigger_id,
    team,
    channel,
    message,
  } = req.body;
  const linkToMessage =
    `https://${team.domain}.slack.com/archives/${channel.id}/p${message.ts.replace('.', '')}`;
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
  // Expects dialog submission like the one sent in `attachToIssueFromMessage`

  // Respond to Slack immediately to avoid error message shown to user
  res.send();

  const { response_url, submission } = req.body;
  const { url, comment } = submission;

  const resource = githubUrl(url);
  if (!(resource.type === 'issue' || resource.type === 'pull')) {
    return axios.post(response_url, new DialogSubmissionError('The URL you entered is invalid', submission).toJSON());
  }

  const { slackUser, robot } = res.locals;

  let data;
  try {
    ({ data } = await slackUser.GitHubUser.client.issues.createComment({
      ...resource,
      type: undefined,
      body: comment,
    }));
  } catch (err) {
    if (!(err.code && err.code === 404)) {
      throw err;
    }
    req.log.debug({ err }, 'Could not create comment');

    const appUrl = (await robot.info()).html_url;
    return axios.post(response_url, new DialogSubmissionError('Could not create comment', submission, appUrl, resource).toJSON());
  }
  return axios.post(response_url, {
    response_type: 'ephemeral',
    attachments: [new CommentCreated(data.html_url).getAttachment()],
  });
}

module.exports = {
  createCommentFromDialog,
  attachToIssueFromMessage,
};
