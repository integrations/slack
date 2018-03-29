if (process.env.NEWRELIC_KEY) {
  require('newrelic'); // eslint-disable-line global-require
}

const session = require('cookie-session');
const helmet = require('helmet');
const sslify = require('express-sslify');

const setupSlack = require('./slack');
const setupGitHub = require('./github');
const frontend = require('./frontend');
const errorHandler = require('./error-handler');

module.exports = (robot) => {
  const app = robot.route();

  errorHandler.setup(app);

  if (process.env.FORCE_HTTPS) {
    app.use(helmet());
    app.use(sslify.HTTPS({ trustProtoHeader: true }));
  }

  app.use(frontend);

  app.use(session({
    keys: [process.env.GITHUB_CLIENT_SECRET],
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    // FIXME: bug in superagent/cookiejar that prevents it from saving this
    signed: process.env.NODE_ENV !== 'test',
  }));

  setupSlack(robot);
  setupGitHub(robot);

  errorHandler.teardown(app);

  // Fetch and cache info about the GitHub App
  robot.info = async function info() { // eslint-disable-line no-param-reassign
    const github = await this.auth();
    const res = await github.apps.get({});

    // Override info method with cached data
    this.info = async () => res.data;

    return res.data;
  };
};
