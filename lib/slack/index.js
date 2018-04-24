const bodyParser = require('body-parser');

const unfurls = require('../unfurls');
const commands = require('../commands');
const oauth = require('./oauth');
const importer = require('./importer');
const uninstall = require('./uninstall');
const middleware = require('./../middleware');
const create = require('../create');

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

  router.post('/events.link_shared', unfurls.linkShared);
  router.post('/events.config_migration', importer);
  router.post('/events.app_uninstalled', uninstall);

  router.use('/actions', middleware.parseActionPayload);
  router.use('/actions', middleware.validate);
  router.use('/actions', middleware.routeAction);

  router.post('/actions:unfurl', unfurls.unfurlAction);

  router.post('/actions:create', create.dialogSubmit);
};
