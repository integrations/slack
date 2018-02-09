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

    Subscription.LegacySubscription = models.LegacySubscription;
  };

  // Map GitHub event names to the names used for settings
  const EventNameToSettings = {
    pull_request: 'pulls',
    status: 'statuses',
    deployment_status: 'deployments',
    push: 'commits',
    issue_comment: 'comments',
  };

  const DefaultSettings = {
    issues: true,
    pulls: true,
    deployments: true,
    statuses: true,
    public: true,
    commits: true,
    comments: false,
  };

  Object.assign(Subscription.prototype, {
    cacheKey(...parts) {
      return [`subscription#${this.id}`].concat(parts).join(':');
    },

    isEnabledForGitHubEvent(event) {
      const key = EventNameToSettings[event] || event;
      const settings = Object.assign({}, DefaultSettings, this.settings);
      return settings[key] === true;
    },

    enable(events) {
      [].concat(events).forEach((event) => {
        this.settings[event] = true;
      });
      this.changed('settings', true);
    },

    disable(events) {
      [].concat(events).forEach((event) => {
        this.settings[event] = false;
      });
      this.changed('settings', true);
    },

    async migrate() {
      const legacySubscription = await Subscription.LegacySubscription.findOne({
        where: {
          repoGitHubId: this.githubId,
          workspaceSlackId: (await this.getSlackWorkspace()).slackId,
          channelSlackId: this.channelId,
        },
      });

      if (legacySubscription) {
        const config = legacySubscription.originalSlackConfiguration;
        this.settings = {
          issues: config.do_issues,
          pulls: config.do_pullrequest,
          deployments: config.do_deployment_status,
          commits: config.do_commits,
          comments: config.do_issue_comments,
          // "do_commit_comments": true,
          // "do_commits_showsimple": false,
          // "do_pullrequest_reviews": true,
          // "do_issue_titles_only": false,
          // "do_branches": true,
          // "do_force_pushes": false,
        };

        await this.save();
      }

      return this;
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

      return (await this.create(attrs)).migrate();
    },

    async unsubscribe(githubId, channelId, slackWorkspaceId) {
      await this.destroy({ where: { githubId, channelId, slackWorkspaceId } });
    },
  });

  return Subscription;
};
