const defaults = Object.assign({
  NODE_ENV: 'test',
  LOG_LEVEL: 'error',
  SLACK_VERIFICATION_TOKEN: 'secret',
  SLACK_ACCESS_TOKEN: '',
  SLACK_CLIENT_ID: 'slack-client-id',
  SLACK_CLIENT_SECRET: 'slack-client-secret',
  GITHUB_CLIENT_ID: '',
  GITHUB_CLIENT_SECRET: 'github-secret',
  STORAGE_SECRET: '8cad66340bc92edbae2ae3a792d351f48c61d1d8efe7b2d9408b0025c1f7f845',
  // Uncomment to enable long stack traces and warnings from Bluebird
  // BLUEBIRD_DEBUG: 'true',
  DEPLOY_COMMAND_ENABLED: 'true',
}, process.env);

const Sequelize = require('sequelize');

Sequelize.Promise.longStackTraces();

// Assign defaults to process.env, but don't override existing values if they
// are already set in the environment.
//
//   $ LOG_LEVEL=trace jest path/to/test.js
Object.assign(process.env, defaults);
