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
  });

  LegacySubscription.import = (configuration) => {
    if (configuration.repos) {
      return Promise.all(configuration.repos.map(repo => LegacySubscription.create({
        channelSlackId: configuration.channel_id,
        authorSlackId: configuration.user_id,
        workspaceSlackId: configuration.team_id,
        repoGitHubId: repo.id,
        repoFullName: repo.full_name,
        originalSlackConfiguration: configuration,
        serviceSlackId: configuration.id,
      })));
    }
  };

  return LegacySubscription;
};
