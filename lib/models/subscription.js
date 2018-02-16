module.exports = (sequelize, DataTypes) => {
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
        include: [Subscription.SlackWorkspace, Subscription.Installation],
      });
    },

    async doAllTheShit({
      repository, installation, channel, creator, settings,
    }) {
      const [subscription, created] = await this.findOrCreate({
        where: {
          githubId: repository.id,
          channelId: channel.id,
          slackWorkspaceId: channel.workspace.id,
        },
        defaults: {
          creatorId: creator.id,
          installationId: installation.id,
          settings,
        },
      });

      if (!created && settings) {
        await subscription.update({ settings });
      }

      return subscription;
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
  });

  return Subscription;
};
