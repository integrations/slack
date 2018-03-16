const GitHubApi = require('probot/lib/github');
const logger = require('probot/lib/logger');

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

async function getAttachment(github, url, unfurlType) {
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
  return !recentlySeen;
}

async function removeUnfurlEligibility(teamId, channelId, link) {
  const key = `${teamId}-${channelId}-${link}`;
  return cache.set(key, true);
}

async function isPrivate(github, url) {
  const params = githubUrl(url);
  // for now: if it's not part of a repo, then it can't be private
  if (Object.keys(params).indexOf('repo') === -1) {
    return false;
  }
  let repo;
  try {
    repo = await github.repos.get(params);
  } catch (err) {
    if (err.code === 404) {
      return true;
    }
    throw err;
  }
  return repo.data.private;
}

async function dispatch({
  workspace,
  channel,
  ts,
  url,
  attachment,
}) {
  const unfurls = {
    [url]: attachment,
  };
  logger.debug(unfurls, 'Unfurling links');
  const slackRes = await workspace.client.chat.unfurl({
    ts,
    channel,
    unfurls,
  });
  logger.trace(slackRes, 'Unfurl complete');
}

class Unfurl {
  constructor(unfurlType, url, github) {
    this.unfurlType = unfurlType;
    this.url = url;
    this.github = github;
  }

  async toAttachment() {
    try {
      this.attachment = await getAttachment(this.github, this.url, this.unfurlType);
    } catch (err) {
      if (err instanceof UnsupportedResource || err.code === 404) {
        logger.debug(err, 'Could not get unfurl attachment');
        return null;
      }
      throw err;
    }
    return this.attachment;
  }
  // logic around private unfurls - only do private unfurls for full unfurls
  // get rendered attaachment based on link
}

// class Unfurls {
//   // takes in raw Slack event: and then formats the different ones for Slack using Unfurl
//
//   // checks number of *eligible* unfurls and determines whether condensed
//   // sends the actual unfurl array to Slack
// }

async function handler(req, res) {
  // todo: make it clearer what the flows should be and what initial states are

  // event comes in
  // only do this for single links for now:
  // parse link to github resource
  // is it on a repo? Make request to repo to see if it's private
  // Is the repo private? If yes send message to the user asking if they want to unfurl (or later look up setting)
  // res.send(200) to Slack

  // let event handler create unfurl rows
  // constructor evaluates whether it should be dispatched right away?
  const { robot } = res.locals;
  const { SlackWorkspace, SlackUser, GitHubUser } = robot.models;
  const { event } = req.body;

  req.log.debug(req.body, 'Slack event received');

  // if there are 3 or more, don't unfurl at all
  if (event.links.length > 2) {
    return res.send();
  }

  let eligibleLinks = await Promise.all(event.links
    .map(async (link) => {
      const eligible = await isEligibleForUnfurl(req.body.team_id, event.channel, link.url);
      console.log('eligible', eligible);
      if (eligible) {
        req.log.debug(link, 'Link eligible for unfurls');
        return link;
      }
      req.log.debug(link, 'Link not eligible for unfurl');
      return null;
    }));
  eligibleLinks = eligibleLinks.filter(link => link);

  console.log('Eligible links', eligibleLinks.length);
  if (eligibleLinks.length === 0) {
    return res.send();
  }

  // if there's 1 link in the message, full unfurl
  // if there are 2 links in the message, condensed unfurl for both
  const type = eligibleLinks.length === 1 ? 'full' : 'condensed';

  // Get user token. If githubuser is not linked, fall back to GITHUB_TOKEN.
  // If that doesn't work it's either private OR a true 404
  const workspace = await SlackWorkspace.findOne({
    where: { slackId: req.body.team_id },
  });

  const slackUser = await SlackUser.findOne({
    where: {
      slackWorkspaceId: parseInt(workspace.id, 10),
      slackId: event.user,
    },
    include: [GitHubUser],
  });

  const github = new GitHubApi({ logger: req.log });
  if (slackUser && slackUser.GitHubUser) {
    console.log('used private unfurl');
    // Todo: need to handle case where this token was revoked
    github.authenticate({
      type: 'oauth',
      token: slackUser.GitHubUser.accessToken,
    });
  } else {
    await workspace.client.chat.postEphemeral({
      text: 'want to see rich previews in Slack? Connect your GitHub account',
      channel: event.channel,
      user: event.user,
    });
    return res.send();
    // Use installation token for public unfurls?

    // In the future you will *need* to link your GitHub account to unfurl links
    // @todo: Temporary workaround for unfurling public links
    // eslint-disable-next-line no-lonely-if
    if (process.env.GITHUB_TOKEN) {
      github.authenticate({
        type: 'token',
        token: process.env.GITHUB_TOKEN,
      });
    }
  }

  if (await isPrivate(github, eligibleLinks[0].url)) {
    console.log('is private')
    // yo dawg it's a private link. Do you want to unfurl?
    // should ultimately also check settings
    // Should we staff ship this to only our team? possibly

    // send chat.postEphemeral with action
    // store callback id in the db -- somehow
    // workflow gets picked up again when we get the button action event (this should be in the model)
    await workspace.client.chat.postEphemeral({
      channel: event.channel,
      user: event.user,
      attachments: [{
        title: `Do you want to show a rich preview for ${eligibleLinks[0].url}?`,
        text: 'The link you shared is private, so not everyone in this workspace may have access to it.',
        callback_id: `unfurl-${event.message_ts}`, // this should be db id for unfurl. message_ts should be stored in db. message_ts and channel should be unique together
        actions: [
          {
            name: 'unfurl',
            text: 'Show rich preview',
            type: 'button',
            style: 'primary',
            value: eligibleLinks[0].url,
          },
          {
            name: 'unfurl-always',
            text: 'Always show a rich preview',
            type: 'button',
          },
        ],
      }],
    });
    return res.send();
  }
  // first thing we need to do: are we unfurling something in a repo?
  // and then: is that repo private?

  const unfurls = {};
  await Promise.all(eligibleLinks.map(async (link) => {
    const attachment = await new Unfurl(type, link.url, github).toAttachment();
    if (attachment) {
      unfurls[link.url] = attachment;
    }
    return removeUnfurlEligibility(req.body.team_id, event.channel, link.url);
  }));

  await Promise.all(Object.keys(unfurls).map(url => dispatch({
    workspace,
    channel: event.channel,
    ts: event.message_ts,
    url,
    attachment: unfurls[url],
  })));

  return res.send();
}

getAttachment.handler = handler;
getAttachment.dispatch = dispatch;

module.exports = getAttachment;
