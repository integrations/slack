const { WebClient } = require('@slack/client');
const { createSlackEventAdapter } = require('@slack/events-api');
const logger = require('probot/lib/logger');

module.exports = {
  web: new WebClient(process.env.SLACK_ACCESS_TOKEN, {
    // Disable infinite retry
    retryConfig: { retries: 0 },
    logger: (level, ...args) => {
      const map = { verbose: 'debug', silly: 'trace' }[level] || level;
      return logger[map](...args);
    },
  }),
  events: createSlackEventAdapter(process.env.SLACK_VERIFICATION_TOKEN),
};
