const { Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  // Map GitHub event names to the names used for settings
  const EventNameToSettings = {
    pull_request: {
      opened: 'pulls',
      closed: 'pulls',
      reopened: 'pulls',
      synchronize: 'pulls',
      review_requested: 'review_requests',
    },
    status: 'statuses',
    deployment_status: 'deployments',
    push: 'commits',
    issue_comment: 'comments',
    commit_comment: 'comments',
    create: 'branches',
    delete: 'branches',
    pull_request_review: 'reviews',
    pull_request_review_comment: 'comments',
    release: 'releases',
  };

  const DefaultSettings = {
    issues: true,
    pulls: true,
    review_requests: false,
    deployments: true,
    statuses: true,
    public: true,
    commits: true,
    releases: true,
    comments: false,
    branches: false,
    reviews: false,
  };

  const FixedSettings = {
    repository: true,
  };

  const AllowValues = {
    commits: ['all'],
  };

  const Subscription = sequelize.define('Subscription', {
    githubId: DataTypes.BIGINT,
    // Storing only for debugging purposes. Do not use for querying data since it might change
    githubName: DataTypes.STRING,
    channelId: DataTypes.STRING,
    type: DataTypes.STRING,
    settings: {
      type: DataTypes.JSON,

      set(values) {
        if (Array.isArray(values) || typeof values === 'string') {
          this.enable(values);
        } else {
          Object.assign(this.settings, values);
        }
        this.changed('settings', true);
      },

      get() {
        if (!this.getDataValue('settings')) {
          this.setDataValue('settings', {});
        }
        return this.getDataValue('settings');
      },

      validate: {
        hasValidValues(value) {
          const validValuesMessage = [
            'Available features are:',
            Object.keys(DefaultSettings).map(feature => `\`${feature}\``).join(', '),
          ].join('\n');

          Object.keys(value).forEach((setting) => {
            if (DefaultSettings[setting] === undefined) {
              throw new Error(`\`${setting}\` is not a feature. ${validValuesMessage}`);
            }
            if (typeof value[setting] !== 'boolean' && !AllowValues[setting].includes(value[setting])) {
              throw new Error(`\`${setting}:${value[setting]}\` is not a feature. ${validValuesMessage}`);
            }
          });
        },
      },
    },
  });

  Subscription.hook('afterDestroy', async (subscription) => {
    await sequelize.model('DeletedSubscription').create(subscription.dataValues);
  });

  Subscription.associate = (models) => {
    Subscription.SlackWorkspace = Subscription.belongsTo(models.SlackWorkspace, {
      foreignKey: 'slackWorkspaceId',
    });
    Subscription.Installation = Subscription.belongsTo(models.Installation, {
      foreignKey: 'installationId',
      allowNull: false,
    });
    Subscription.Creator = Subscription.belongsTo(models.SlackUser, {
      foreignKey: 'creatorId',
      allowNull: true,
    });
  };

  Object.assign(Subscription.prototype, {
    cacheKey(...parts) {
      return [`channel#${this.slackWorkspaceId}#${this.channelId}`].concat(parts).join(':');
    },

    getSettingsKey(event, action) {
      if (typeof EventNameToSettings[event] === 'string') {
        return EventNameToSettings[event];
      }
      if (EventNameToSettings[event] instanceof Object) {
        return EventNameToSettings[event][action];
      }
      return event;
    },

    isEnabledForGitHubEvent(event, action) {
      const key = this.getSettingsKey(event, action);
      const settings = Object.assign({}, DefaultSettings, this.settings, FixedSettings);
      return !!settings[key];
    },

    enable(features) {
      [].concat(features).forEach((feature) => {
        const [name, value] = feature.split(':');
        this.settings[name] = value || true;
      });
      this.changed('settings', true);
    },

    getEnabledSettings() {
      const settings = Object.assign({}, DefaultSettings, this.settings);
      return Object.keys(settings).map((setting) => {
        if (settings[setting] === true) {
          return setting;
        } else if (settings[setting]) {
          return `${setting}:${settings[setting]}`;
        }
        return null;
      }).filter(setting => setting);
    },

    disable(features) {
      [].concat(features).forEach((feature) => {
        const [name] = feature.split(':');
        this.settings[name] = false;
      });
      this.changed('settings', true);
    },

    async updateGithubName(githubName) {
      if (githubName && this.githubName !== githubName) {
        await this.update({ githubName });
      }
    },

    async destroyWithReason(reason) {
      await this.destroy();
      await sequelize.model('DeletedSubscription').update({ reason }, { where: { id: this.id } });
    },

  });

  Object.assign(Subscription, {
    async lookup(githubId) {
      return this.findAll({
        where: { githubId },
        include: [Subscription.SlackWorkspace, Subscription.Installation],
      });
    },

    async lookupAll(query) {
      return this.findAll({
        where: {
          [Op.or]: query,
        },
        include: [Subscription.SlackWorkspace, Subscription.Installation],
      });
    },

    async lookupOne(githubId, channelId, slackWorkspaceId) {
      return this.findOne({
        where: { githubId, channelId, slackWorkspaceId },
        include: [Subscription.SlackWorkspace, Subscription.Installation],
      });
    },

    async subscribe(attrs) {
      if (!attrs.creatorId) {
        // Effectively enforcing not-null constaint at app level
        throw Error('Need to pass creatorId for new subscriptions');
      }

      const record = await this.create(attrs);

      return record.reload({
        include: [Subscription.SlackWorkspace, Subscription.Installation],
      });
    },

    async unsubscribe(githubId, channelId, slackWorkspaceId) {
      const where = { githubId, channelId, slackWorkspaceId };
      const subscriptions = await this.findAll({ where });
      await this.destroy({ where, individualHooks: true });

      const ids = subscriptions.map(subscription => subscription.id);
      await sequelize.model('DeletedSubscription').update({ reason: 'unsubscribe' }, { where: { id: ids } });
    },

    groupByChannel(subscriptions) {
      return subscriptions.reduce((byChannel, subscription) => {
        if (!byChannel[subscription.channelId]) {
          // eslint-disable-next-line no-param-reassign
          byChannel[subscription.channelId] = [];
        }

        byChannel[subscription.channelId].push(subscription);

        return byChannel;
      }, {});
    },

    async destroyByCreatorId(creatorId) {
      const { Installation } = sequelize.models;
      const subscriptions = await this.findAll({
        where: { creatorId },
        include: [Installation],
      });
      await this.destroy({
        where: { creatorId },
        individualHooks: true,
      });
      const ids = subscriptions.map(subscription => subscription.id);
      await sequelize.model('DeletedSubscription').update({ reason: 'signout' }, { where: { id: ids } });
      return subscriptions;
    },
  });

  return Subscription;
};
