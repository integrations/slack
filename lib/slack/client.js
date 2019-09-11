const { WebClient } = require('@slack/web-api');
// FIXME: this shouldn't be required directly. This client needs refactored to
//        be passed `robot` at runtime an get the logger from `robot.log`
const logger = require('../logger');

class SlackProbotLoggerAdapter {
  static debug(...msgs) { logger.debug(...msgs); }
  static info(...msgs) { logger.info(...msgs); }
  static warn(...msgs) { logger.warn(...msgs); }
  static error(...msgs) { logger.error(...msgs); }
  static verbose(...msgs) { logger.debug(...msgs); }
  static silly(...msgs) { logger.trace(...msgs); }
  static setLevel(level) { logger.info(`Slack tried to change the logging level to ${level}`); }
  static setName(name) { logger.info(`Slack tried to change the logger name to ${name}`); }
}

const webClientOptions = {
  logger: SlackProbotLoggerAdapter,
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
