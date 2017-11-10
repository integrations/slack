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

  // Handle errors (see `errorCodes` export)
  slack.events.on('error', logger.error);

  // Attach listeners to events by Slack Event "type". See: https://api.slack.com/events/message.im
  slack.events.on('link_shared', async (event, body) => {
    logger.debug({ slack: body }, 'Slack event received');
    // if there's 1 link in the message, unfurl
    // @todo if there are 2 links in the message, minor unfurl for both
    // if there are 3 or more, don't unfurl

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

    const unfurls = {};

    if (event.links.length === 1) {
      const link = event.links[0];
      if (await isEligibleForUnfurl(body.team_id, event.channel, link.url)) {
        unfurls[link.url] = await unfurl(github, link.url);
      }
    } else if (event.links.length === 2) {
      // @todo minor unfurls
      await Promise.all(event.links.map(async (link) => {
        if (await isEligibleForUnfurl(body.team_id, event.channel, link.url)) {
          unfurls[link.url] = await unfurl(github, link.url);
          console.log('hit');
        }
      }));
    }

    console.log(Object.keys(unfurls).length);
    if (Object.keys(unfurls).length !== 0) {
      console.log('unfurling!');
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
  });
};
