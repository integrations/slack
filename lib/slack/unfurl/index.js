const GitHubApi = require('github');

const slack = require('../client');
const { get, set } = require('../../storage');

const githubUrl = require('../../github-url');

/* eslint-disable global-require */
const resources = {
  account: require('./account'),
  blob: require('./blob'),
  comment: require('./comment'),
  issue: require('./issue'),
  pull: require('./pull'),
  repo: require('./repo'),
};

// eslint-disable-next-line no-unused-vars
async function unfurl(github, url, unfurlType) {
  const params = githubUrl(url);

  if (!params || !resources[params.type]) {
    throw new Error(`Unmatched unfurl URL: ${url}`);
  }

  return resources[params.type](params, github, unfurlType);
}

// check each link on whether it's eligible for unfurl
async function isEligibleForUnfurl(teamId, channelId, link) {
  const key = `${teamId}-${channelId}-${link}`;
  const recentlySeen = await get(key);
  await set(key, true);
  return !recentlySeen;
}

async function handler(req, res) {
  const { robot } = res.locals;
  const { SlackWorkspace } = robot.models;
  const { event } = req.body;

  const github = new GitHubApi();

  // @todo: Temporary workaround for unfurling public links
  if (process.env.GITHUB_TOKEN) {
    github.authenticate({
      type: 'token',
      token: process.env.GITHUB_TOKEN,
    });
  }

  req.log.debug(req.body, 'Slack event received');

  // if there's 1 link in the message, full unfurl
  // if there are 2 links in the message, condensed unfurl for both
  // if there are 3 or more, don't unfurl at all

  async function unfurlInSlack(links, type) {
    const unfurls = {};

    await Promise.all(event.links.map(async (link) => {
      if (await isEligibleForUnfurl(req.body.team_id, event.channel, link.url)) {
        req.log.debug({ url: link.url }, 'Link eligible for unfurls');
        unfurls[link.url] = await unfurl(github, link.url, type);
      } else {
        req.log.debug({ url: link.url }, 'Link not eligible for unfurl');
      }
    }));

    if (Object.keys(unfurls).length !== 0) {
      const workspace = await SlackWorkspace.findOne({
        where: { slackId: req.body.team_id },
      });

      const client = slack.createClient(workspace.accessToken);

      req.log.debug(unfurls, 'Unfurling links');
      const slackRes = await client.chat.unfurl(event.message_ts, event.channel, unfurls);
      req.log.trace(slackRes, 'Unfurl complete');
    }
  }

  if (event.links.length <= 2) {
    const type = event.links.length === 1 ? 'full' : 'condensed';
    await unfurlInSlack(event.links, type);
  }

  res.send();
}

unfurl.handler = handler;

module.exports = unfurl;
