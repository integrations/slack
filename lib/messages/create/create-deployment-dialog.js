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
        option_groups: [
          {
            label: 'Tags',
            options: tags.map(({ ref }) => ({
              label: ref,
              value: ref,
            })),
          },
          {
            label: 'Branches',
            options: branches.map(({ name }) => ({
              label: name,
              value: name,
            })),
          },
        ],
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
