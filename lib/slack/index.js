const bodyParser = require('body-parser');
const GitHubApi = require('github');

const slack = require('./client');
const unfurl = require('./unfurl');
const commands = require('./commands');
const oauth = require('./oauth');
const { get, set } = require('../storage');

const github = new GitHubApi();

// @todo: Temporary workaround for unfurling public links
if (process.env.GITHUB_TOKEN) {
  github.authenticate({
    type: 'token',
    token: process.env.GITHUB_TOKEN,
  });
}

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
  slack.events.on('link_shared', async (event, body, respond) => {
    robot.log.debug(body, 'Slack event received');

    // if there's 1 link in the message, full unfurl
    // if there are 2 links in the message, condensed unfurl for both
    // if there are 3 or more, don't unfurl at all

    // check each link on whether it's eligible for unfurl
    async function isEligibleForUnfurl(teamId, channelId, link) {
      return !(await get(`${teamId}-${channelId}-${link}`));
    }

    async function unfurlInSlack(links, type) {
      const unfurls = {};

      await Promise.all(event.links.map(async (link) => {
        if (await isEligibleForUnfurl(body.team_id, event.channel, link.url)) {
          robot.log.debug({ url: link.url }, 'Link eligible for unfurls');
          unfurls[link.url] = await unfurl(github, link.url, type);
        } else {
          robot.log.debug({ url: link.url }, 'Link not eligible for unfurl');
        }
      }));

      if (Object.keys(unfurls).length !== 0) {
        robot.log.debug(unfurls, 'Unfurling links');
        const res = await slack.web.chat.unfurl(event.message_ts, event.channel, unfurls);
        robot.log.trace(res, 'Unfurl complete');
        // set links in redis
        Object.keys(unfurls).forEach((link) => {
          set(`${body.team_id}-${event.channel}-${link}`, true);
        });
      }
    }

    if (event.links.length <= 2) {
      const type = event.links.length === 1 ? 'full' : 'condensed';
      await unfurlInSlack(event.links, type);
    }

    respond();
  });
};
