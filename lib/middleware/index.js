/* eslint-disable global-require */

module.exports = {
  authenticate: require('./authenticate'),
  getInstallation: require('./get-installation'),
  getResource: require('./get-resource'),
  routeCommand: require('./route-command'),
  routeEvent: require('./route-event'),
  sentryContext: require('./sentry-context'),
  pendingCommand: require('./pending-command'),
  urlVerification: require('./url-verification'),
  validate: require('./validate'),
  parseActionPayload: require('./parse-action-payload'),
};
