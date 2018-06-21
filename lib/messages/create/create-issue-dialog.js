
module.exports = ({ repository, labels = [] }) => {
  const dialog = {
    callback_id: 'create-issue-dialog',
    title: 'Open a new issue',
    submit_label: 'Open',
    elements: [
      {
        label: 'Repository',
        type: 'select',
        name: 'repository',
        value: repository.id,
        options: [{
          label: repository.full_name,
          value: repository.id,
        }],
      },
      {
        type: 'text',
        label: 'Title',
        name: 'title',
      },
      {
        type: 'textarea',
        label: 'Body',
        name: 'body',
        placeholder: 'Leave a comment',
        hint: 'GitHub markdown syntax is supported, although you cannot preview it in Slack.',
      },
    ],
  };

  if (labels) {
    dialog.elements.push({
      label: 'Label',
      type: 'select',
      name: 'label',
      optional: true,
      options: labels.map(({ id, name }) => ({
        label: name,
        value: id,
      })),
    });
  }

  return dialog;
};
