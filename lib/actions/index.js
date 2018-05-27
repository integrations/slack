async function createIssue(req, res) {
  const { slackWorkspace } = res.locals;
  const { trigger_id, message } = req.body;
  const dialog = {
    callback_id: 'create-issue-dialog',
    title: 'Open new issue',
    submit_label: 'Open',
    elements: [
      {
        label: 'Repository',
        type: 'select',
        name: 'repository',
        data_source: 'external',
      },
      {
        type: 'text',
        label: 'Title',
        name: 'title',
      },
      {
        type: 'textarea',
        label: 'Write',
        value: message.text,
        name: 'body',
        placeholder: 'Leave a comment',
        hint: 'GitHub markdown syntax is supported, although you cannot preview it in Slack.',
      },
    ],
  };

  await slackWorkspace.client.dialog.open({
    dialog,
    trigger_id,
  });

  return res.send(dialog);
}

module.exports = {
  createIssue,
};
