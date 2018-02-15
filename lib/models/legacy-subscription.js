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

  LegacySubscription.import = (configuration) => {
    if (configuration.repos) {
      return Promise.all(configuration.repos.map(async (repo) => {
        const existingLegacySubscription = await LegacySubscription.findOne({
          where: {
            channelSlackId: configuration.channel_id,
            workspaceSlackId: configuration.team_id,
            serviceSlackId: configuration.id,
            repoGitHubId: repo.id,
          },
        });
        if (existingLegacySubscription) {
          return Promise.resolve();
        }
        return LegacySubscription.create({
          channelSlackId: configuration.channel_id,
          authorSlackId: configuration.user_id,
          workspaceSlackId: configuration.team_id,
          repoGitHubId: repo.id,
          repoFullName: repo.full_name,
          originalSlackConfiguration: configuration,
          serviceSlackId: configuration.id,
        });
      }));
    }
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

      // eslint-disable-next-line no-underscore-dangle
      await client._makeAPICall('services.update', payload);

      return this.update({ activatedAt: new Date() });
    },
  });

  return LegacySubscription;
};
