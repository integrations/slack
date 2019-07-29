function getOptionsForRef(branches, tags) {
  const options = [];
  if (tags.length > 0) {
    options.push({
      label: 'Tags',
      options: tags.map(({ ref }) => ({
        label: ref,
        value: ref,
      })),
    });
  }
  // Always expect at least one branch, i.e. master
  options.push({
    label: 'Branches',
    options: branches.map(({ name }) => ({
      label: name,
      value: name,
    })),
  });
  return options;
}

module.exports = ({ repository, branches, tags }) => {
  const dialog = {
    callback_id: 'create-deployment-dialog',
    title: 'Trigger a deployment',
    submit_label: 'Create',
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
        label: 'Branch or tag to deploy',
        type: 'select',
        name: 'ref',
        option_groups: getOptionsForRef(branches, tags),
      },
      {
        type: 'text',
        label: 'Environment',
        name: 'environment',
        optional: true,
        placeholder: 'Default: `production`',
      },
      {
        type: 'text',
        label: 'Task',
        name: 'task',
        optional: true,
        placeholder: 'Default: `deploy`',
      },
      {
        type: 'textarea',
        label: 'Payload',
        name: 'payload',
        placeholder: '{}',
        hint: 'JSON payload with extra information about the deployment',
        optional: true,
      },
    ],
  };
  return dialog;
};
