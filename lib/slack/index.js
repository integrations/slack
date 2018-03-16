const bodyParser = require('body-parser');
const GitHubApi = require('probot/lib/github');

const unfurl = require('../unfurls');
const commands = require('../commands');
const oauth = require('./oauth');
const importer = require('./importer');
const uninstall = require('./uninstall');
const middleware = require('./../middleware');

module.exports = (robot) => {
  const router = robot.route('/slack');

  // Make robot available
  router.use((req, res, next) => {
    res.locals.robot = robot;
    next();
  });

  router.use(bodyParser.json());
  router.use(bodyParser.urlencoded({ extended: true }));

  // Set up slash commands
  commands(robot);

  // Set up OAuth
  router.get('/oauth/login', oauth.login);
  router.get('/oauth/callback', oauth.callback);

  // Set up event handlers
  router.use('/events', middleware.validate);
  router.use('/events', middleware.urlVerification);
  router.use('/events', middleware.routeEvent);

  router.post('/events.link_shared', unfurl.handler);
  router.post('/events.config_migration', importer);
  router.post('/events.app_uninstalled', uninstall);

  router.use('/actions', middleware.parseActionPayload);
  router.use('/actions', middleware.validate);
  router.post('/actions', async (req, res) => {
    console.log(req.body);
    const { SlackWorkspace, SlackUser, GitHubUser } = res.locals.robot.models;
    const workspace = await SlackWorkspace.findOne({
      where: { slackId: req.body.team.id },
    });

    const slackUser = await SlackUser.findOne({
      where: {
        slackWorkspaceId: parseInt(workspace.id, 10),
        slackId: req.body.user.id,
      },
      include: [GitHubUser],
    });
    if (!(slackUser || slackUser.GitHubUser)) {
      res.send('You need to connect your GitHub account to your Slack account');
    }
    const github = new GitHubApi({ logger: req.log });
    github.authenticate({
      type: 'oauth',
      token: slackUser.GitHubUser.accessToken,
    });
    const attachment = await unfurl(github, req.body.actions[0].value, 'full');
    unfurl.dispatch({
      workspace,
      channel: req.body.channel.id,
      ts: req.body.callback_id.replace('unfurl-', ''),
      url: req.body.actions[0].value,
      attachment,
    });
    return res.send({
      delete_original: true,
    });
  });
};
