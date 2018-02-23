module.exports = (sequelize, DataTypes) => {
  // Map GitHub event names to the names used for settings
  const EventNameToSettings = {
    pull_request: 'pulls',
    status: 'statuses',
    deployment_status: 'deployments',
    push: 'commits',
    issue_comment: 'comments',
    create: 'branches',
    delete: 'branches',
    pull_request_review: 'reviews',
  };

  const DefaultSettings = {
    issues: true,
    pulls: true,
    deployments: true,
    statuses: true,
    public: true,
    commits: true,
    comments: false,
    branches: false,
    reviews: false,
  };

  const AllowValues = {
    commits: ['all'],
  };

  const Subscription = sequelize.define('Subscription', {
    githubId: DataTypes.BIGINT,
    channelId: DataTypes.STRING,
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
          Object.keys(value).forEach((setting) => {
            if (DefaultSettings[setting] === undefined) {
              throw new Error(`"${setting}" is not a setting`);
            }
            if (typeof value[setting] !== 'boolean' && !AllowValues[setting].includes(value[setting])) {
              throw new Error(`"${setting}:${value[setting]}" is not a setting`);
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
      return [`subscription#${this.id}`].concat(parts).join(':');
    },

    isEnabledForGitHubEvent(event) {
      const key = EventNameToSettings[event] || event;
      const settings = Object.assign({}, DefaultSettings, this.settings);
      return !!settings[key];
    },

    enable(events) {
      [].concat(events).forEach((event) => {
        const [name, value] = event.split(':');
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

    disable(events) {
      [].concat(events).forEach((event) => {
        const [name] = event.split(':');
        this.settings[name] = false;
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

    async lookupOne(githubId, channelId, slackWorkspaceId) {
      return this.findOne({
        where: { githubId, channelId, slackWorkspaceId },
      });
    },

    async subscribe(attrs) {
      if (!attrs.creatorId) {
        // Effectively enforcing not-null constaint at app level
        throw Error('Need to pass creatorId for new subscriptions');
      }

      return this.create(attrs);
    },

    async unsubscribe(githubId, channelId, slackWorkspaceId) {
      await this.destroy({ where: { githubId, channelId, slackWorkspaceId } });
    },
  });

  return Subscription;
};
