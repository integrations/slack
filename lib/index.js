const session = require('cookie-session');
const helmet = require('helmet');
const sslify = require('express-sslify');

const models = require('./models');
const setupSlack = require('./slack');
const setupGitHub = require('./github');
const frontend = require('./frontend');
const errorHandler = require('./error-handler');

module.exports = (robot) => {
  /* eslint-disable no-param-reassign */
  robot.models = models({ logger: robot.log });

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
  }));

  setupSlack(robot);
  setupGitHub(robot);

  errorHandler.teardown(app);

  // Fetch and cache info about the GitHub App
  robot.info = async function info() {
    const github = await this.auth();
    const res = await github.apps.get({});

    // Override info method with cached data
    this.info = async () => res.data;

    return res.data;
  };
};
