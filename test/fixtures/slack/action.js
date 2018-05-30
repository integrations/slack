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
  unfurlDismiss: unfurlId => ({
    token: process.env.SLACK_VERIFICATION_TOKEN,
    type: 'interactive_message',
    callback_id: `unfurl-${unfurlId}`,
    action_ts: '1522448284.018267',
    message_ts: '1522448135.000220',
    attachment_id: 1,
    is_app_unfurl: false,
    actions: [
      {
        name: 'unfurl-dismiss',
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
  unfurlMutePrompts: actionName => ({
    token: process.env.SLACK_VERIFICATION_TOKEN,
    type: 'interactive_message',
    callback_id: 'unfurl-mute-prompts',
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
  cancel: () => ({
    token: process.env.SLACK_VERIFICATION_TOKEN,
    type: 'interactive_message',
    callback_id: 'does-not-matter',
    action_ts: '1522448284.018267',
    message_ts: '1522448135.000220',
    attachment_id: 1,
    is_app_unfurl: false,
    actions: [
      {
        name: 'cancel',
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
  dialogSubmissionSingleRepo: () => ({
    token: process.env.SLACK_VERIFICATION_TOKEN,
    type: 'dialog_submission',
    callback_id: 'create-issue-dialog',
    action_ts: '1524614235.114006',
    submission: {
      repository: '54321',
      title: 'hiiii',
      body: 'testing testing testing',
    },
    team: {
      id: 'T0001',
      domain: 'acmecorp',
    },
    user: {
      id: 'U2147483697',
      name: 'george',
    },
    channel: {
      id: 'C2147483705',
      name: 'some-channel',
    },
  }),
  unfurlSettingsAutoGetSettingsForRepo: () => ({
    token: process.env.SLACK_VERIFICATION_TOKEN,
    type: 'interactive_message',
    callback_id: 'unfurl-settings-auto',
    action_ts: '1522448284.018267',
    message_ts: '1522448135.000220',
    attachment_id: 1,
    is_app_unfurl: false,
    actions: [
      {
        name: 'get-settings-for-repo',
        selected_options: [{
          value: '12345|integrations/snappydoo',
        }],
      },
    ],
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
    response_url: 'https://hooks.slack.com/actions/1234/5678',
    trigger_id: '13345224609.738474920.8088930838d88f008e0',
  }),
  unfurlSettingsAutoRemoveRepo: () => ({
    token: process.env.SLACK_VERIFICATION_TOKEN,
    type: 'interactive_message',
    callback_id: 'unfurl-settings-auto',
    action_ts: '1522448284.018267',
    message_ts: '1522448135.000220',
    attachment_id: 1,
    is_app_unfurl: false,
    actions: [
      {
        name: 'remove-repo',
        value: '12345|integrations/snappydoo',
      },
    ],
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
    response_url: 'https://hooks.slack.com/actions/1234/5678',
    trigger_id: '13345224609.738474920.8088930838d88f008e0',
  }),
  unfurlSettingsUnmutePrompts: () => ({
    token: process.env.SLACK_VERIFICATION_TOKEN,
    type: 'interactive_message',
    callback_id: 'unfurl-settings',
    action_ts: '1522448284.018267',
    message_ts: '1522448135.000220',
    attachment_id: 1,
    is_app_unfurl: false,
    actions: [
      {
        name: 'unmute-prompts',
        value: '',
      },
    ],
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
    response_url: 'https://hooks.slack.com/actions/1234/5678',
    trigger_id: '13345224609.738474920.8088930838d88f008e0',
  }),
  attachToIssue: () => ({
    token: process.env.SLACK_VERIFICATION_TOKEN,
    callback_id: 'attach-to-issue',
    type: 'message_action',
    trigger_id: '13345224609.738474920.8088930838d88f008e0',
    response_url: 'https://hooks.slack.com/actions/1234/5678',
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
    message: {
      type: 'message',
      user: 'U0MJRG1AL',
      ts: '1516229207.000133',
      text: 'World\'s smallest big cat! <https://youtube.com/watch?v=W86cTIoMv2U>',
    },
  }),
  addComment: url => ({
    token: process.env.SLACK_VERIFICATION_TOKEN,
    callback_id: 'add-comment',
    type: 'dialog_submission',
    trigger_id: '13345224609.738474920.8088930838d88f008e0',
    response_url: 'https://hooks.slack.com/actions/1234/5678',
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
    submission: {
      url: url || '',
      issueId: 'MDU6SXNzdWUzMjQwNjI0NTc=',
      comment: '> World\'s smallest big cat! < https://youtube.com/watch?v=W86cTIoMv2U>\\\\n<sub>[View message in Slack](https://example.slack.com/archives/C74M/p1516229207000133)</sub>',
    },
  }),
};
