const bodyParser = require('body-parser');

const unfurl = require('../unfurls');
const commands = require('../commands');
const oauth = require('./oauth');
const importer = require('./importer');
const uninstall = require('./uninstall');
const middleware = require('./../middleware');

const { Unfurl } = require('../models');

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

  router.post('/events.link_shared', unfurl);
  router.post('/events.config_migration', importer);
  router.post('/events.app_uninstalled', uninstall);

  router.use('/actions', middleware.parseActionPayload);
  router.use('/actions', middleware.validate);
  router.post('/actions', async (req, res) => {
    // right now we assume every button action is related to unfurls
    // we should have something like routeAction to be more generic
    console.log(req.body);

    const storedUnfurl = await Unfurl.findById(req.body.callback_id.replace('unfurl-', ''));
    await storedUnfurl.deliver();

    // try catch to see if user doesn't have github account connected:
    // if (!(slackUser || slackUser.GitHubUser)) {
    //   res.send('You need to connect your GitHub account to your Slack account');
    // }
    return res.send({
      delete_original: true,
    });
  });
};
