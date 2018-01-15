const { WebClient } = require('@slack/client');
const { createLogger } = require('probot');

const logger = createLogger();

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

function createClient(token, options = {}) {
  return new WebClient(token, Object.assign({}, webClientOptions, options));
}

module.exports = {
  createClient,
};
