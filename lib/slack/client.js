const { WebClient } = require('@slack/client');
const { createSlackEventAdapter } = require('@slack/events-api');
// FIXME: this shouldn't be required directly. This client needs refactored to
//        be passed `robot` at runtime an get the logger from `robot.log`
const logger = require('probot/lib/logger');

const webClientOptions = {
  logger: (level, ...args) => {
    const map = { verbose: 'debug', silly: 'trace' }[level] || level;
    return logger[map](...args);
  },
  slackAPIUrl: process.env.SLACK_API_URL || 'https://slack.com/api/',
};

// Disable retries in tests
if (process.env.NODE_ENV === 'test') {
  webClientOptions.retryConfig = { retries: 0 };
}

module.exports = {
  web: new WebClient(process.env.SLACK_ACCESS_TOKEN, webClientOptions),
  events: createSlackEventAdapter(process.env.SLACK_VERIFICATION_TOKEN, {
    includeBody: true,
    waitForResponse: true,
  }),
};
