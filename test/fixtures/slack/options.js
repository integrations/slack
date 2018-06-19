module.exports = {
  loadIssuesAndPrs: query => ({
    token: process.env.SLACK_VERIFICATION_TOKEN,
    callback_id: 'add-comment',
    type: 'dialog_suggestion',
    action_ts: '1520635427.671963',
    name: 'selectedUrl',
    value: query || '',
    team: {
      id: 'T0001',
      domain: 'example',
    },
    channel: {
      id: 'C74M',
      name: 'test',
    },
    user: {
      id: 'U2147483697',
      name: 'aaron',
    },
  }),
};
