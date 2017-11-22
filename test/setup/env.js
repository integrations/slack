const defaults = Object.assign({
  LOG_LEVEL: 'error',
  SLACK_VERIFICATION_TOKEN: 'secret',
}, process.env);

// Assign defaults to process.env, but don't override existing values if they
// are already set in the environment.
//
//   $ LOG_LEVEL=trace jest path/to/test.js
Object.assign(process.env, defaults);
