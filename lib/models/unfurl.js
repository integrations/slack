const logger = require('probot/lib/logger');
const GitHubApi = require('probot/lib/github');

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
  account: require('../unfurls/account'),
  blob: require('../unfurls/blob'),
  comment: require('../unfurls/comment'),
  issue: require('../unfurls/issue'),
  pull: require('../unfurls/pull'),
  repo: require('../unfurls/repo'),
};

module.exports = (sequelize, DataTypes) => {
  const { SlackWorkspace, SlackUser, GitHubUser } = sequelize.models;
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
      const slackWorkspace = await SlackWorkspace.findById(this.slackWorkspaceId);
      const key = `${slackWorkspace.slackId}-${this.channelSlackId}-${this.url}`;
      return cache.set(key, true);
    },

    async deliver() {
      const slackUser = await SlackUser.findById(this.slackUserId);
      const github = await this.constructor.getGitHubClient(this.channelSlackId, slackUser.slackId);
      const {
        attachment,
        githubType,
      } = await this.constructor.getAttachment(github, this.url, this.isCondensed);
      const unfurls = {
        [this.url]: attachment,
      };
      logger.debug(unfurls, 'Unfurling links');
      const slackWorkspace = await SlackWorkspace.findById(this.slackWorkspaceId);
      const slackRes = await slackWorkspace.client.chat.unfurl({
        ts: this.slackMessageTimestamp,
        channel: this.channelSlackId,
        unfurls,
      });
      logger.trace(slackRes, 'Unfurl complete');
      await this.removeUnfurlEligibility();
      this.githubType = githubType;
      this.isDelivered = true;
      await this.save();
    },
  });

  Object.assign(Unfurl, {
    async getGitHubClient(channelId, userSlackId) {
      const github = new GitHubApi({ logger });

      if (!process.env.ALLOWED_CHANNELS || !process.env.ALLOWED_CHANNELS.split(',').includes(channelId)) {
        // keep the old way of doing things working
        if (process.env.GITHUB_TOKEN) {
          github.authenticate({
            type: 'token',
            token: process.env.GITHUB_TOKEN,
          });
          logger.debug({
            channelId,
          }, 'using PAT authed github client for unfurl');
        }
        return github;
      }

      const slackUser = await SlackUser.findOne({
        where: { slackId: userSlackId },
        include: [GitHubUser],
      });

      if (!slackUser.GitHubUser) {
        throw Error('no github account connected');
      }

      github.authenticate({
        type: 'oauth',
        token: slackUser.GitHubUser.accessToken,
      });
      logger.debug({
        channelId,
        userSlackId: slackUser.slackId,
        userGitHubId: slackUser.GitHubUser.id,
      }, 'using user authed github client for unfurl');
      return github;
    },

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
      const params = githubUrl(url);
      if (!params || !resources[params.type]) {
        throw new UnsupportedResource(url);
      }
      const attachment = await resources[params.type](params, github, unfurlType);

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
      const repo = await github.repos.get(params);
      return repo.data.private;
    },


    async spawn({
      teamId, userId, channel, url, isCondensed, slackMessageTimestamp,
    }) {
      const workspace = await SlackWorkspace.findOne({
        where: { slackId: teamId },
      });

      const [slackUser] = await SlackUser.findOrCreate({
        where: {
          slackWorkspaceId: parseInt(workspace.id, 10),
          slackId: userId,
        },
      });

      // Private check only carried out for unfurls in ALLOWED_CHANNELS
      if (process.env.ALLOWED_CHANNELS && process.env.ALLOWED_CHANNELS.split(',').includes(channel)) {
        const github = await this.getGitHubClient(channel, userId);
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
      }

      const unfurl = await this.build({
        slackWorkspaceId: workspace.id,
        slackUserId: slackUser.id,
        channelSlackId: channel,
        url,
        isCondensed,
        isPublic: true,
        isDelivered: false,
        slackMessageTimestamp,
      });
      // Not private, so deliver immediately
      await unfurl.deliver();
      return unfurl;
    },
  });

  return Unfurl;
};
