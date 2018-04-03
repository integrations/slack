const GitHubApi = require('probot/lib/github');

const { SlackWorkspace } = require('../models');
const cache = require('../cache');

const githubUrl = require('../github-url');

class UnsupportedResource extends Error {
  constructor(url) {
    super(url);
    this.name = 'UnsupportedResource';
  }
}

/* eslint-disable global-require */
const resources = {
  account: require('./account'),
  blob: require('./blob'),
  comment: require('./comment'),
  issue: require('./issue'),
  pull: require('./pull'),
  repo: require('./repo'),
};

async function unfurl(github, url, unfurlType) {
  const params = githubUrl(url);

  if (!params || !resources[params.type]) {
    throw new UnsupportedResource(url);
  }

  return resources[params.type](params, github, unfurlType);
}

// check each link on whether it's eligible for unfurl
async function isEligibleForUnfurl(teamId, channelId, link) {
  const key = `${teamId}-${channelId}-${link}`;
  const recentlySeen = await cache.get(key);
  await cache.set(key, true);
  return !recentlySeen;
}

async function handler(req, res) {
  const { event } = req.body;

  req.log.debug(req.body, 'Slack event received');

  // if there are 3 or more, don't unfurl at all
  if (event.links.length > 2) {
    res.send();
    return;
  }

  // if there's 1 link in the message, full unfurl
  // if there are 2 links in the message, condensed unfurl for both
  const type = event.links.length === 1 ? 'full' : 'condensed';

  // @todo: Temporary workaround for unfurling public links
  const github = new GitHubApi({ logger: req.log });
  if (process.env.GITHUB_TOKEN) {
    github.authenticate({
      type: 'token',
      token: process.env.GITHUB_TOKEN,
    });
  }

  const unfurls = {};

  await Promise.all(event.links.map(async (link) => {
    if (await isEligibleForUnfurl(req.body.team_id, event.channel, link.url)) {
      req.log.debug(link, 'Link eligible for unfurls');
      try {
        unfurls[link.url] = await unfurl(github, link.url, type);
      } catch (err) {
        if (err instanceof UnsupportedResource || err.code === 404) {
          req.log.debug(err, 'Could not unfurl');
        } else {
          throw err;
        }
      }
    } else {
      req.log.debug(link, 'Link not eligible for unfurl');
    }
  }));

  if (Object.keys(unfurls).length !== 0) {
    const workspace = await SlackWorkspace.findOne({
      where: { slackId: req.body.team_id },
    });

    req.log.debug(unfurls, 'Unfurling links');
    const slackRes = await workspace.client.chat.unfurl({
      ts: event.message_ts,
      channel: event.channel,
      unfurls,
    });
    req.log.trace(slackRes, 'Unfurl complete');
  }

  res.send();
}

unfurl.handler = handler;

module.exports = unfurl;
