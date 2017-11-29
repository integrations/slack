const defaults = Object.assign({
  LOG_LEVEL: 'error',
  SLACK_VERIFICATION_TOKEN: 'secret',
  SLACK_CLIENT_ID: '',
  SLACK_CLIENT_SECRET: '',
  SLACK_APP_ID: '',
  GITHUB_CLIENT_ID: '',
  GITHUB_CLIENT_SECRET: '',
  APP_HOST: 'example.com',
  CRYPTO_SECRET: '',
}, process.env);

// Assign defaults to process.env, but don't override existing values if they
// are already set in the environment.
//
//   $ LOG_LEVEL=trace jest path/to/test.js
Object.assign(process.env, defaults);
