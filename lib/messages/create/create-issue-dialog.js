
module.exports = (repositories) => {
  const dialog = {
    callback_id: 'create-issue-dialog',
    title: 'Open new issue',
    submit_label: 'Open',
    elements: [
      {
        type: 'text',
        label: 'Title',
        name: 'title',
      },
      {
        type: 'textarea',
        label: 'Write',
        name: 'body',
        placeholder: 'Leave a comment',
        hint: 'GitHub markdown syntax is supported, although you cannot preview it in Slack.',
      },
    ],
  };

  if (repositories.length === 1) {
    dialog.elements[0].hint = `The issue will be opened on ${repositories[0].full_name}`;
  } else {
    dialog.elements.unshift({
      label: 'Repository',
      type: 'select',
      name: 'repository',
      placeholder: 'Select the repository on which to open the issue',
      options: repositories.map(repository => ({
        label: repository.full_name,
        value: repository.id,
      })),
    });
  }
  return dialog;
};
