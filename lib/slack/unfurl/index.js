const slack = require('../client');
const { get, set } = require('../../storage');

const githubUrl = require('../../github-url');

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

// check each link on whether it's eligible for unfurl
async function isEligibleForUnfurl(teamId, channelId, link) {
  const key = `${teamId}-${channelId}-${link}`;
  const recentlySeen = await get(key);
  await set(key, true);
  return !recentlySeen;
}

module.exports = async function handler(req, res) {
  const { robot } = res.locals;
  const { SlackWorkspace, SlackUser, GitHubUser, Installation } = robot.models;
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

  const slackUser = await SlackUser.findOne({
    where: { slackId: event.user },
    include: [
      GitHubUser,
      { model: SlackWorkspace, where: { slackId: req.body.team_id } },
    ],
  });

  let githubToken = process.env.GITHUB_TOKEN;

  if (slackUser) {
    req.log.debug({ slackId: slackUser.slackId }, 'Authenticated user');
    githubToken = slackUser.GitHubUser.accessToken;
  }

  // Get github client from Probot to get logging and throttling
  const github = await robot.auth();

  if (githubToken) {
    // Re-authenticate as current user
    github.authenticate({
      type: 'token',
      token: githubToken,
    });
  } else {
    github.authenticate(false)
  }

  const unfurls = {};

  await Promise.all(event.links.map(async (link) => {
    if (await isEligibleForUnfurl(req.body.team_id, event.channel, link.url)) {
      req.log.debug(link, 'Link eligible for unfurls');

      const params = githubUrl(link.url);

      try {
        if (!params || !resources[params.type]) {
          throw new UnsupportedResource(link.url);
        }

        unfurls[link.url] = await resources[params.type](params, github, type);
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

    const client = slack.createClient(workspace.accessToken);

    req.log.debug(unfurls, 'Unfurling links');
    const slackRes = await client.chat.unfurl(event.message_ts, event.channel, unfurls);
    req.log.trace(slackRes, 'Unfurl complete');
  }

  res.send();
};

Object.assign(module.exports, resources);
