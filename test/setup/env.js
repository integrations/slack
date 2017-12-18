const defaults = Object.assign({
  LOG_LEVEL: 'error',
  SLACK_OLD_VERIFICATION_TOKEN: 'secret',
  SLACK_VERIFICATION_TOKEN: 'secret',
  SLACK_ACCESS_TOKEN: '',
  SLACK_CLIENT_ID: 'slack-client-id',
  SLACK_CLIENT_SECRET: 'slack-client-secret',
  GITHUB_CLIENT_ID: '',
  GITHUB_CLIENT_SECRET: 'github-secret',
  APP_HOST: 'example.com',
  // Uncomment to enable long stack traces and warnings from Bluebird
  // BLUEBIRD_DEBUG: 'true',
}, process.env);

const Sequelize = require('sequelize');

Sequelize.Promise.longStackTraces();

// Assign defaults to process.env, but don't override existing values if they
// are already set in the environment.
//
//   $ LOG_LEVEL=trace jest path/to/test.js
Object.assign(process.env, defaults);
