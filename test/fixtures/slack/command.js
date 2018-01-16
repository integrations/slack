module.exports = attrs => Object.assign({
  // Slack will POST with:
  token: process.env.SLACK_VERIFICATION_TOKEN,
  team_id: 'T0001',
  team_domain: 'example',
  enterprise_id: 'E0001',
  enterprise_name: 'Globular%20Construct%20Inc',
  channel_id: 'C2147483705',
  channel_name: 'test',
  user_id: 'U2147483697',
  user_name: 'Steve',
  command: '/github',
  text: 'subscribe https://github.com/atom/atom',
  response_url: 'https://hooks.slack.com/commands/1234/5678',
  trigger_id: '13345224609.738474920.8088930838d88f008e0',
}, attrs);
