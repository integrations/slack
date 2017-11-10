const { WebClient } = require('@slack/client');
const { createSlackEventAdapter } = require('@slack/events-api');

module.exports = {
  web: new WebClient(process.env.SLACK_ACCESS_TOKEN),
  events: createSlackEventAdapter(process.env.SLACK_VERIFICATION_TOKEN, {
    includeBody: true,
  }),
};
