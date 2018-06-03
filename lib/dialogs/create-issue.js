module.exports = (message, channel, team) => {
  const linkToMessage = `https://${team.domain}.slack.com/archives/${
    channel.id
  }/p${message.ts.replace('.', '')}`;

  const comment = `> ${message.text}\n<sub>[View message in Slack](${linkToMessage})</sub>`;

  return {
    callback_id: 'create-issue',
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
        value: comment,
        name: 'body',
        placeholder: 'Leave a comment',
        hint: 'GitHub markdown syntax is supported, although you cannot preview it in Slack.',
      },
    ],
  };
};
