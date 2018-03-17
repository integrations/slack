const logger = require('probot/lib/logger');
const GitHubApi = require('probot/lib/github');

const cache = require('../cache');
const githubUrl = require('../github-url');
const models = require('.');

class UnsupportedResource extends Error {
  constructor(url) {
    super(url);
    this.name = 'UnsupportedResource';
  }
}

class GitHubAccountNotConnected extends Error {
  constructor(url) {
    super(url);
    this.name = 'GitHubAccountNotConnected';
  }
}

/* eslint-disable global-require */
const resources = {
  account: require('../unfurls/account'),
  blob: require('../unfurls/blob'),
  comment: require('../unfurls/comment'),
  issue: require('../unfurls/issue'),
  pull: require('../unfurls/pull'),
  repo: require('../unfurls/repo'),
};

async function deliver(github, url, slackWorkspace, slackMessageTimestamp, channel, isCondensed) {
  if (!this.prototype) {
    // access to Unfurl instance
    // eslint-disable-next-line no-shadow
    const github = await this.getGitHubClient();
    const {
      attachment,
      githubType,
    } = await this.constructor.getAttachment(github, this.url, this.isCondensed);
    if (!attachment) {
      return;
    }
    const unfurls = {
      [this.url]: attachment,
    };
    logger.debug(unfurls, 'Unfurling links');
    const { SlackWorkspace } = models({ logger });
    // eslint-disable-next-line no-shadow
    const slackWorkspace = await SlackWorkspace.findById(this.slackWorkspaceId);
    const slackRes = await slackWorkspace.client.chat.unfurl({
      ts: this.slackMessageTimestamp,
      channel: this.channelSlackId,
      unfurls,
    });
    logger.trace(slackRes, 'Unfurl complete');
    await this.removeUnfurlEligibility();
    return this.update({
      isDelivered: true,
      githubType,
    });
  }
  const { attachment, githubType } = await this.getAttachment(github, url, isCondensed);
  if (!attachment) {
    return;
  }
  const unfurls = {
    [url]: attachment,
  };
  logger.debug(unfurls, 'Unfurling links');
  const slackRes = await slackWorkspace.client.chat.unfurl({
    ts: slackMessageTimestamp,
    channel,
    unfurls,
  });
  logger.trace(slackRes, 'Unfurl complete');
  // new unfurl row should be created here
  return githubType;
}

module.exports = (sequelize, DataTypes) => {
  const Unfurl = sequelize.define('Unfurl', {
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    channelSlackId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    githubType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isCondensed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    isDelivered: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    slackMessageTimestamp: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });

  // eslint-disable-next-line no-shadow
  Unfurl.associate = (models) => {
    Unfurl.belongsTo(models.SlackWorkspace, {
      foreignKey: 'slackWorkspaceId',
      allowNull: false,
    });
    Unfurl.belongsTo(models.SlackUser, {
      foreignKey: 'slackUserId',
      allowNull: true,
    });
  };

  Object.assign(Unfurl.prototype, {
    async removeUnfurlEligibility() {
      const { SlackWorkspace } = models({ logger });
      const slackWorkspace = await SlackWorkspace.findById(this.slackWorkspaceId);
      const key = `${slackWorkspace.slackId}-${this.channelId}-${this.url}`;
      return cache.set(key, true);
    },

    async getGitHubClient() {
      const { SlackUser, GitHubUser } = models({ logger });
      const slackUser = await SlackUser.findOne({
        where: { id: this.slackUserId },
        include: [GitHubUser],
      });
      if (!slackUser.GitHubUser) {
        throw Error('no github account connected');
        // res.send('You need to connect your GitHub account to your Slack account');
      }
      const github = new GitHubApi({ logger });
      github.authenticate({
        type: 'oauth',
        token: slackUser.GitHubUser.accessToken,
      });
      return github;
    },
  });

  Object.assign(Unfurl, {
    async isEligibleForUnfurl(teamId, channelId, url) {
      const key = `${teamId}-${channelId}-${url}`;
      const recentlySeen = await cache.get(key);
      return !recentlySeen;
    },

    getResource(url) {
      const params = githubUrl(url);
      if (!params || !resources[params.type]) {
        throw new UnsupportedResource(url);
      }
      return resources[params.type];
    },

    async getAttachment(github, url, isCondensed) {
      const unfurlType = isCondensed ? 'condensed' : 'full';
      let params;
      let attachment;
      try {
        params = githubUrl(url);
        if (!params || !resources[params.type]) {
          throw new UnsupportedResource(url);
        }
        attachment = await resources[params.type](params, github, unfurlType);
      } catch (err) {
        if (err instanceof UnsupportedResource || err.code === 404) {
          logger.debug(err, 'Could not get unfurl attachment');
          attachment = null;
        }
        throw err;
      }

      return {
        attachment,
        githubType: params.type,
      };
    },

    async isPrivate(github, url) {
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
    },


    async spawn({
      teamId, userId, channel, url, isCondensed, slackMessageTimestamp,
    }) {
      const { SlackWorkspace, SlackUser, GitHubUser } = models({ logger });
      const github = new GitHubApi({ logger });

      const workspace = await SlackWorkspace.findOne({
        where: { slackId: teamId },
      });

      const [slackUser] = await SlackUser.findOrCreate({
        where: {
          slackWorkspaceId: parseInt(workspace.id, 10),
          slackId: userId,
        },
        include: [GitHubUser],
      });
      // throw error if github user is not connected AND we can deal with the resource type
      if (!slackUser.GitHubUser && this.getResource(url)) {
        throw new GitHubAccountNotConnected(slackUser);
      }

      github.authenticate({
        type: 'oauth',
        token: slackUser.GitHubUser.accessToken,
      });

      if (await this.isPrivate(github, url)) {
        return this.create({
          slackWorkspaceId: workspace.id,
          slackUserId: slackUser.id,
          channelSlackId: channel,
          url,
          isCondensed,
          isPublic: false,
          slackMessageTimestamp,
          isDelivered: false,
        });
      }

      const githubType = await this.deliver(
        github,
        url,
        workspace,
        slackMessageTimestamp,
        channel,
        isCondensed,
      );
      const unfurl = await this.create({
        slackWorkspaceId: workspace.id,
        slackUserId: slackUser.id,
        channelSlackId: channel,
        url,
        isCondensed,
        isPublic: false,
        isDelivered: true,
        slackMessageTimestamp,
        githubType,
      });
      await unfurl.removeUnfurlEligibility();
      return unfurl;
    },
  });

  Unfurl.deliver = deliver;
  Unfurl.prototype.deliver = deliver;
  return Unfurl;
};
