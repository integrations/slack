const githubUrl = require('../github-url');

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
        label: 'Issue or Pull Request',
        placeholder: githubUrl.resolve('/atom/atom/issues/1'),
        name: 'manualUrl',
        hint: 'A link to a different Issue or Pull Request that you want to comment on in case it\'s not shown in the menu above',
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
