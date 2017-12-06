// Slash Commands - https://api.slack.com/slash-commands

const middleware = require('./middleware');
const subscribe = require('./subscribe');
const signin = require('./signin');

const githubUrl = require('../../github-url');
const GitHub = require('github');

const misc = {
  getResource(req, res, next) {
    const url = req.body.text;

    // Turn the argument into a resource
    const resource = githubUrl(url);

    if (resource && resource.type == 'repo') {
      res.locals.resource = resource;
      next();
    } else {
      // @TODO: Move to renderer
      res.json({
        attachments: [{
          color: 'danger',
          text: `\`${url}\` does not appear to be a GitHub link.`,
          mrkdwn_in: ['text'],
        }],
      });
    }
  },

  /**
   * Get the installation for the given account name
   *
   * @param username - name of a GitHub Organization or User
   */
  async getInstallation(req, res, next) {
    const { robot, resource } = res.locals;
    const { Installation } = robot.models;

    req.log.trace({ resource }, 'Looking up installation');

    // FIXME: need an anuthenticated client, but authenticating as app doesn't work
    // const github = await robot.auth();
    const github = new GitHub();

    let owner;

    // TODO: open friction issue about being able to do this with one API call
    try {
      owner = (await github.orgs.get({ org: resource.owner })).data;
    } catch (err) {
      owner = (await github.users.getForUser({ username: resource.owner })).data;
    }

    const installation = await Installation.getForOwner(owner.id);

    if (installation) {
      res.locals.installation = installation;
      next();
    } else {
      const info = await robot.info();

      res.json({
        attachments: [{
          text: `<${info.html_url}|Install the GitHub App>`,
        }],
      });
    }
  },
};

module.exports = (robot) => {
  const app = robot.route('/slack/command');

  // Make robot available
  app.use((req, res, next) => {
    res.locals.robot = robot;
    next();
  });

  app.use(middleware.validate);
  app.use(middleware.route);
  app.post(/(?:un)?subscribe/,
    middleware.authenticate,
    misc.getResource,
    misc.getInstallation,
    subscribe);

  app.post('/signin', signin);

  robot.log.trace('Loaded commands');
};
