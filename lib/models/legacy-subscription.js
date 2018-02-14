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

  return LegacySubscription;
};
