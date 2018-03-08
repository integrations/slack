/* eslint-disable global-require */
const querystring = require('querystring');

module.exports = {
  app: require('./app'),
  issue: require('./issue'),
  pull: require('./pull'),
  comment: require('./comment'),
  contents: require('./contents'),
  user: require('./user'),
  org: require('./org'),
  repo: require('./repo'),
  atomRepo: require('./atom-repo'),
  kubernetesRepo: require('./kubernetes-repo'),
  combinedStatus: require('./combined_status_some_passing'),
  slack: {
    link_shared: require('./slack/link_shared'),
    command: attrs => Object.assign({
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
    }, attrs),
    team: {
      info: require('./slack/team.info'),
    },
    oauth: {
      token: require('./slack/oauth.token'),
    },
  },
  github: {
    webhooks: {
      issue_comment: require('./webhooks/issue_comment'),
    },
    oauth: querystring.stringify({
      access_token: 'testing123',
      token_type: 'bearer',
    }),
  },
};
