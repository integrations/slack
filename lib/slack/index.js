const bodyParser = require('body-parser');
const GitHubApi = require('github');

const slack = require('./client');
const unfurl = require('./unfurl');
const commands = require('./commands');

const github = new GitHubApi();

module.exports = (robot) => {
  const router = robot.route('/slack');
  const logger = robot.log;

  router.use(bodyParser.json());
  router.use(bodyParser.urlencoded({ extended: true }));

  // Mount the event handler on a route
  router.use('/events', slack.events.expressMiddleware());

  commands(robot);

  // Handle errors (see `errorCodes` export)
  slack.events.on('error', logger.error);

  // Attach listeners to events by Slack Event "type". See: https://api.slack.com/events/message.im
  slack.events.on('link_shared', (event) => {
    logger.debug({ slack: event }, 'Slack event received');

    const unfurls = {};
    event.links.forEach(async (link) => {
      unfurls[link.url] = await unfurl(github, link.url);
      logger.trace(unfurls, 'Unfurling links');
      slack.web.chat.unfurl(
        event.message_ts,
        event.channel,
        unfurls,
        (err, slackRes) => {
          if (err) {
            logger.error(err);
          } else {
            logger.trace(slackRes, 'Unfurl complete');
          }
        },
      );
    });
  });
};
