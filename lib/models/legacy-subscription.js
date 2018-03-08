const logger = require('probot/lib/logger');

module.exports = (sequelize, DataTypes) => {
  const LegacySubscription = sequelize.define('LegacySubscription', {
    workspaceSlackId: {
      allowNull: false,
      type: DataTypes.STRING,
    },
    repoGitHubId: {
      allowNull: false,
      type: DataTypes.BIGINT,
    },
    repoFullName: {
      allowNull: false,
      type: DataTypes.STRING,
    },
    authorSlackId: {
      allowNull: false,
      type: DataTypes.STRING,
    },
    channelSlackId: {
      allowNull: false,
      type: DataTypes.STRING,
    },
    serviceSlackId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    originalSlackConfiguration: {
      allowNull: false,
      type: DataTypes.JSON,
    },
    activatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  LegacySubscription.importAll = async configs => (
    // Return one flattened list of all the imported subscriptions
    [].concat(...await Promise.all(configs.map(LegacySubscription.import)))
  );

  LegacySubscription.import = async (configuration) => {
    if (configuration.repos) {
      const subscriptions = await Promise.all(configuration.repos.map(async (repo) => {
        const [subscription, created] = await LegacySubscription.findOrCreate({
          where: {
            channelSlackId: configuration.channel_id,
            workspaceSlackId: configuration.team_id,
            serviceSlackId: configuration.id,
            repoGitHubId: repo.id,
          },
          defaults: {
            authorSlackId: configuration.user_id,
            repoFullName: repo.full_name,
            originalSlackConfiguration: configuration,
          },
        });

        return created ? subscription : false;
      }));

      return subscriptions.filter(subscription => subscription);
    }
  };

  LegacySubscription.groupByChannel = subscriptions => (
    subscriptions.reduce((byChannel, subscription) => {
      if (!byChannel[subscription.channelSlackId]) {
        // eslint-disable-next-line no-param-reassign
        byChannel[subscription.channelSlackId] = [];
      }

      // Check for duplicates
      const exists = byChannel[subscription.channelSlackId]
        .find(s => s.authorSlackId === subscription.authorSlackId &&
            s.repoFullName === subscription.repoFullName);

      if (!exists) {
        byChannel[subscription.channelSlackId].push(subscription);
      }

      return byChannel;
    }, {})
  );

  LegacySubscription.migrate = async (subscription) => {
    // check if there are any legacy configurations that we can disable
    const legacySubscriptions = await LegacySubscription.findAll({
      where: {
        activatedAt: null,
        channelSlackId: subscription.channelId,
        repoGitHubId: subscription.githubId,
        workspaceSlackId: subscription.SlackWorkspace.slackId,
      },
    });

    let settings = {};

    await Promise.all(legacySubscriptions.map(async (legacySubscription) => {
      await legacySubscription.deactivate(subscription.SlackWorkspace.client);

      const config = legacySubscription.originalSlackConfiguration;
      settings = {
        branches: settings.branches || config.do_branches,
        comments: settings.comments || config.do_issue_comments,
        commits: settings.commits || (config.do_commits ? 'all' : false),
        deployments: settings.deployments || config.do_deployment_status,
        issues: settings.issues || config.do_issues,
        pulls: settings.pulls || config.do_pullrequest,
        reviews: settings.reviews || config.do_pullrequest_reviews,
      };
    }));

    return subscription.update({ settings });
  };

  Object.assign(LegacySubscription.prototype, {
    async deactivate(client) {
      // call Slack API to disable subscription
      const payload = {
        payload: JSON.stringify({
          action: 'mark_subscribed',
          repo: {
            full_name: this.repoFullName,
            id: this.repoGitHubId,
          },
          service_type: 'github',
        }),
        service: this.serviceSlackId,
      };

      try {
        logger.level('fatal');
        // eslint-disable-next-line no-underscore-dangle
        await client._makeAPICall('services.update', payload);
      } catch (err) {
        logger.level(process.env.LOG_LEVEL);
        // This means they already removed the old integration
        if (err.message !== 'service_removed') {
          throw err;
        }
      } finally {
        logger.level(process.env.LOG_LEVEL);
      }

      return this.update({ activatedAt: new Date() });
    },
  });

  return LegacySubscription;
};
