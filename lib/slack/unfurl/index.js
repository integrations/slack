const GitHubApi = require('github');

const slack = require('../client');
const { get, set } = require('../../storage');

// Roadmap: What do we want to unfurl?
// Phase 1: Issues, Pull Requests, Repositories, Profiles, Organizations, App
// Phase 2: Repository contents (files), Projects, Gists

// likely need different regular expressions based on what we're trying to parse

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

function handler(robot) {
  const { SlackWorkspace } = robot.models;
  const log = robot.log;

  const github = new GitHubApi();

  // @todo: Temporary workaround for unfurling public links
  if (process.env.GITHUB_TOKEN) {
    github.authenticate({
      type: 'token',
      token: process.env.GITHUB_TOKEN,
    });
  }

  return async (event, body, respond) => {
    log.debug(body, 'Slack event received');

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
          log.debug({ url: link.url }, 'Link eligible for unfurls');
          unfurls[link.url] = await unfurl(github, link.url, type);
        } else {
          log.debug({ url: link.url }, 'Link not eligible for unfurl');
        }
      }));

      if (Object.keys(unfurls).length !== 0) {
        const workspace = await SlackWorkspace.findOne({
          where: { slackId: body.team_id },
        });

        const client = slack.createClient(workspace.accessToken);

        log.debug(unfurls, 'Unfurling links');
        const res = await client.chat.unfurl(event.message_ts, event.channel, unfurls);
        // set links in redis
        Object.keys(unfurls).forEach((link) => {
          set(`${body.team_id}-${event.channel}-${link}`, true);
        });
        log.trace(res, 'Unfurl complete');
      }
    }

    if (event.links.length <= 2) {
      const type = event.links.length === 1 ? 'full' : 'condensed';
      await unfurlInSlack(event.links, type);
    }

    respond();
  };
}

unfurl.handler = handler;

module.exports = unfurl;
