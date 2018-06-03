module.exports = (issue) => {
  const { data } = issue;

  const attachments = [
    {
      fallback: `${data.title} created successfully`,
      color: '#36a64f',
      pretext: `Issue #${data.number} was created successfully`,
      author_name: `Issue #${data.number}`,
      author_link: data.url,
      title: data.title,
      title_link: data.url,
      text: data.body,
      fields: [
        {
          title: 'State',
          value: data.state,
          short: true,
        },
        {
          title: 'Created By',
          value: data.user.login,
          short: true,
        },
        {
          title: 'URL',
          value: data.url,
          short: false,
        },
      ],
    },
  ];
  return attachments;
};
