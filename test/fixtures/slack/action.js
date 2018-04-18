module.exports = {
  unfurl: unfurlId => ({
    token: process.env.SLACK_VERIFICATION_TOKEN,
    type: 'interactive_message',
    callback_id: `unfurl-${unfurlId}`,
    action_ts: '1522448284.018267',
    message_ts: '1522448135.000220',
    attachment_id: 1,
    is_app_unfurl: false,
    actions: [
      {
        name: 'unfurl',
        type: 'button',
        value: '',
      },
    ],
    team: {
      id: 'T000A',
      domain: 'example',
    },
    channel: {
      id: 'C74M',
      name: 'test',
    },
    user: {
      id: 'U88HS',
      name: 'aaron',
    },
    response_url: 'https://hooks.slack.com/actions/1234/5678',
    trigger_id: '13345224609.738474920.8088930838d88f008e0',
  }),
  unfurlAuto: (owner, repo, repoId, actionName) => ({
    token: process.env.SLACK_VERIFICATION_TOKEN,
    type: 'interactive_message',
    callback_id: `unfurl-auto-${repoId}|${owner}/${repo}`,
    action_ts: '1522448284.018267',
    message_ts: '1522448135.000220',
    attachment_id: 1,
    is_app_unfurl: false,
    actions: [
      {
        name: actionName,
        type: 'button',
        value: '',
      },
    ],
    team: {
      id: 'T000A',
      domain: 'example',
    },
    channel: {
      id: 'C74M',
      name: 'test',
    },
    user: {
      id: 'U88HS',
      name: 'aaron',
    },
    response_url: 'https://hooks.slack.com/actions/1234/5678',
    trigger_id: '13345224609.738474920.8088930838d88f008e0',
  }),
};
