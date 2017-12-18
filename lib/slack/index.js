const bodyParser = require('body-parser');

const slack = require('./client');
const unfurl = require('./unfurl');
const commands = require('./commands');
const oauth = require('./oauth');
const middleware = require('./commands/middleware');

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
};
