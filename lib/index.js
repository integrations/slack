const models = require('./models');
const setupSlack = require('./slack');
const setupGitHub = require('./github');
const frontend = require('./frontend');

module.exports = (robot) => {
  /* eslint-disable no-param-reassign */
  robot.models = models(robot);

  setupSlack(robot);
  setupGitHub(robot);

  robot.router.use(frontend);

  robot.route().get('/boom', () => {
    throw new Error('Boom');
  });

  // Fetch and cache info about the GitHub App
  robot.info = async function info() {
    const github = await this.auth();
    const res = await github.apps.get({});

    // Override info method with cached data
    this.info = async () => res.data;

    return res.data;
  };
};
