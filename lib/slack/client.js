const { WebClient } = require('@slack/client');
// FIXME: this shouldn't be required directly. This client needs refactored to
//        be passed `robot` at runtime an get the logger from `robot.log`
const logger = require('../logger');

const webClientOptions = {
  logger: (level, ...args) => {
    const map = { verbose: 'debug', silly: 'trace' }[level] || level;
    return logger[map](...args);
  },
};

// Disable retries in tests
if (process.env.NODE_ENV === 'test') {
  webClientOptions.retryConfig = { retries: 0 };
}

if (process.env.SLACK_API_URL) {
  webClientOptions.slackApiUrl = process.env.SLACK_API_URL;
}

function createClient(token, options = {}) {
  return new WebClient(token, Object.assign({}, webClientOptions, options));
}

module.exports = {
  createClient,
};
