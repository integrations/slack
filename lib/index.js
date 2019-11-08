const session = require('cookie-session');
const helmet = require('helmet');
const sslify = require('express-sslify');

const setupSlack = require('./slack');
const setupGitHub = require('./github');
const setupApi = require('./api');
const frontend = require('./frontend');
const errorHandler = require('./error-handler');

require('./debugger');

const { SESSION_SECRET } = process.env;
if (!SESSION_SECRET) {
  throw new Error('SESSION_SECRET is not defined.');
}

module.exports = (robot) => {
  const app = robot.route();

  errorHandler.setup(app);

  if (process.env.FORCE_HTTPS) {
    app.use(helmet());
    app.use(sslify.HTTPS({ trustProtoHeader: true }));
  }

  setupApi(robot);

  app.use(session({
    // See https://github.com/expressjs/cookie-session#keys
    // Remove GITHUB_CLIENT_SECRET in a future PR
    // Since GITHUB_CLIENT_SECRET is not keys[0] it is not used for signing new cookies,
    // just for validating old ones
    keys: [SESSION_SECRET, process.env.GITHUB_CLIENT_SECRET],
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    // FIXME: bug in superagent/cookiejar that prevents it from saving this
    signed: process.env.NODE_ENV !== 'test',
  }));

  app.use(frontend);

  setupSlack(robot);
  setupGitHub(robot);

  errorHandler.teardown(app);

  // Fetch and cache info about the GitHub App
  robot.info = async function info() { // eslint-disable-line no-param-reassign
    const github = await this.auth();
    const res = await github.apps.getAuthenticated({});

    // Override info method with cached data
    this.info = async () => res.data;

    return res.data;
  };
};
