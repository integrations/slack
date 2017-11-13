const { WebClient } = require('@slack/client');
const { createSlackEventAdapter } = require('@slack/events-api');

const slackAPIUrl = process.env.SLACK_API_URL || 'https://slack.com/api/';
module.exports = {
  web: new WebClient(process.env.SLACK_ACCESS_TOKEN, {
    slackAPIUrl,
  }),
  events: createSlackEventAdapter(process.env.SLACK_VERIFICATION_TOKEN, {
    includeBody: true,
  }),
};
