const { Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  // Map GitHub event names to the names used for settings
  const EventNameToSettings = {
    pull_request: 'pulls',
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
    deployments: true,
    statuses: true,
    public: true,
    commits: true,
    releases: true,
    comments: false,
    branches: false,
    reviews: false,
    label: [],
  };

  const FixedSettings = {
    repository: true,
  };

  const AllowValues = {
    commits: ['all'],
    label: /^[^,]+$/,
  };

  const Subscription = sequelize.define('Subscription', {
    githubId: DataTypes.BIGINT,
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

          const isAllowedValue = (val, spec) => {
            if (spec === undefined) {
              return false;
            }

            const isAllowed = (v) => {
              if (Array.isArray(spec) && spec.includes(v)) {
                return true;
              }
              if (spec instanceof RegExp && spec.test(v)) {
                return true;
              }
              return false;
            };

            if (![].concat(val).every(isAllowed)) {
              return false;
            }

            return true;
          };

          Object.keys(value).forEach((setting) => {
            if (DefaultSettings[setting] === undefined) {
              throw new Error(`\`${setting}\` is not a feature. ${validValuesMessage}`);
            }

            if (typeof value[setting] !== 'boolean' && !isAllowedValue(value[setting], AllowValues[setting])) {
              throw new Error(`\`${setting}:${value[setting]}\` is not a feature. ${validValuesMessage}`);
            }
          });
        },
      },
    },
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

    isEnabledForGitHubEvent(event) {
      const key = EventNameToSettings[event] || event;
      const settings = Object.assign({}, DefaultSettings, this.settings, FixedSettings);
      return !!settings[key];
    },

    enable(features) {
      [].concat(features).forEach((feature) => {
        // Split "feature" string into "name" and "value"
        // "value" may contain colon (ex. labels:priority:MUST)
        const name = feature.split(':')[0];
        const value = feature.split(':').slice(1).join(':');

        if (Array.isArray(DefaultSettings[name])) {
          if (!Array.isArray(this.settings[name])) {
            this.settings[name] = [];
          }
          this.settings[name].push(value);
          this.settings[name] = [...new Set(this.settings[name])];
        } else {
          this.settings[name] = value || true;
        }
      });
      this.changed('settings', true);
    },

    getEnabledSettings() {
      const settings = Object.assign({}, DefaultSettings, this.settings);
      return Object.keys(settings).map((setting) => {
        if (settings[setting] === true) {
          return setting;
        } else if (Array.isArray(settings[setting]) && settings[setting].length === 0) {
          // If array type setting has no element, it is considered as disabled
          return null;
        } else if (settings[setting]) {
          return `${setting}:${settings[setting]}`;
        }
        return null;
      }).filter(setting => setting);
    },

    disable(features) {
      [].concat(features).forEach((feature) => {
        // Split "feature" string into "name" and "value"
        // "value" may contain colon (ex. labels:priority:MUST)
        const name = feature.split(':')[0];
        const value = feature.split(':').slice(1).join(':');

        if (Array.isArray(DefaultSettings[name])) {
          if (!Array.isArray(this.settings[name]) || !value) {
            this.settings[name] = [];
          } else {
            const s = new Set(this.settings[name]);
            s.delete(value);
            this.settings[name] = Array.from(s);
          }
        } else {
          this.settings[name] = false;
        }
      });
      this.changed('settings', true);
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
      await this.destroy({ where: { githubId, channelId, slackWorkspaceId } });
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
      });
      return subscriptions;
    },
  });

  return Subscription;
};
