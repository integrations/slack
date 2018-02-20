const session = require('express-session');

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

  app.use(frontend);

  app.use(session({
    secret: process.env.GITHUB_CLIENT_SECRET,
    cookie: { maxAge: 30 * 24 * 60 * 1000 },
    resave: false,
    saveUninitialized: false,
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
