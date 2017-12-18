const bodyParser = require('body-parser');

const slack = require('./client');
const unfurl = require('./unfurl');
const commands = require('./commands');
const oauth = require('./oauth');

module.exports = (robot) => {
  const router = robot.route('/slack');

  // Make robot available
  router.use((req, res, next) => {
    res.locals.robot = robot;
    next();
  });

  router.use(bodyParser.json());
  router.use(bodyParser.urlencoded({ extended: true }));

  // Mount the event handler on a route
  router.use('/events', slack.events.expressMiddleware());

  // Set up slash commands
  commands(robot);

  // Set up OAuth
  router.get('/oauth/login', oauth.login);
  router.get('/oauth/callback', oauth.callback);

  // Handle errors (see `errorCodes` export)
  slack.events.on('error', robot.log.error);

  // Attach listeners to events by Slack Event "type". See: https://api.slack.com/events/message.im
  slack.events.on('link_shared', unfurl.handler(robot));
};
