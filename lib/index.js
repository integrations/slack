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

  setupSlack(robot);
  setupGitHub(robot);

  app.use(frontend);

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
