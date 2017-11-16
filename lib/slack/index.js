const bodyParser = require('body-parser');
const GitHubApi = require('github');

const slack = require('./client');
const unfurl = require('./unfurl');
const { get, set } = require('../storage');

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
  slack.events.on('link_shared', async (event, body) => {
    logger.debug({ slack: body }, 'Slack event received');
    // if there's 1 link in the message, full unfurl
    // if there are 2 links in the message, condensed unfurl for both
    // if there are 3 or more, don't unfurl at all

    // check each link on whether it's eligible for unfurl
    async function isEligibleForUnfurl(teamId, channelId, link) {
      try {
        await get(`${teamId}-${channelId}-${link}`);
        logger.debug('not eligible for unfurl!');
        return false;
      } catch (e) {
        logger.debug(e);
        logger.debug('eligible for unfurls!');
        return true;
      }
    }

    async function unfurlInSlack(links, type) {
      const unfurls = {};
      // @todo condensed unfurls
      await Promise.all(event.links.map(async (link) => {
        if (await isEligibleForUnfurl(body.team_id, event.channel, link.url)) {
          unfurls[link.url] = await unfurl(github, link.url, type);
        }
      }));

      if (Object.keys(unfurls).length !== 0) {
        slack.web.chat.unfurl(event.message_ts, event.channel, unfurls, (err, slackRes) => {
          if (err) {
            logger.error(err);
          } else {
            logger.trace(slackRes, 'Unfurl complete');
            // set links in redis
            Object.keys(unfurls).forEach((link) => {
              set(`${body.team_id}-${event.channel}-${link}`, true);
            });
          }
        });
      }
    }

    if (event.links.length > 2) {
      return;
    }

    const type = event.links.length === 1 ? 'full' : 'condensed';

    unfurlInSlack(event.links, type);
  });
};
