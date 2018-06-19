
module.exports = (message, channel, team) => {
  const linkToMessage =
    `https://${team.domain}.slack.com/archives/${channel.id}/p${message.ts.replace('.', '')}`;

  const comment = `> ${message.text}\n<sub>[View in Slack](${linkToMessage})</sub>`;

  return {
    callback_id: 'add-comment',
    title: 'Comment on Issue or PR',
    submit_label: 'Comment',
    elements: [
      {
        type: 'select',
        label: 'Search by title',
        name: 'selectedUrl',
        data_source: 'external',
        min_query_length: 0,
        optional: true,
      },
      {
        type: 'text',
        subtype: 'url',
        label: 'Issue/pull request URL',
        placeholder: 'https://github.com/atom/atom/issues/1',
        name: 'manualUrl',
        hint: 'If you cannot find the issue or pull request in the menu above, you can paste its URL here instead.',
        optional: true,
      },
      {
        type: 'textarea',
        label: 'Comment',
        name: 'comment',
        value: comment,
      },
    ],
  };
};
