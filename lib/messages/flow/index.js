/* eslint-disable global-require */
const Subscribed = require('./subscribed');
const InvalidUrl = require('./invalid-url');
const InstallGitHubApp = require('./install-github-app');
const NotFound = require('./not-found');
const SignIn = require('./signin');
const Help = require('./help');
const AlreadySubscribed = require('./already-subscribed');
const NotSubscribed = require('./not-subscribed');
const ActivateLegacySubscriptions = require('./activate-legacy-subscriptions');
const ReEnableSubscription = require('./re-enable-subscription');
const Exception = require('./exception');
const SlackInstalled = require('./slack-installed');
const UpdatedSettings = require('./updated-settings');
const SignOut = require('./signout');

module.exports = {
  InvalidUrl,
  InstallGitHubApp,
  NotFound,
  Subscribed,
  SignIn,
  Help,
  AlreadySubscribed,
  NotSubscribed,
  ActivateLegacySubscriptions,
  ReEnableSubscription,
  Exception,
  SlackInstalled,
  UpdatedSettings,
  SignOut,
};
