module.exports = (sequelize, DataTypes) => {
  const LegacySubscription = sequelize.define('LegacySubscription', {
    workspaceSlackId: DataTypes.STRING,
    repoGitHubId: DataTypes.BIGINT,
    repoFullName: DataTypes.STRING,
    authorSlackId: DataTypes.STRING,
    channelSlackId: DataTypes.STRING,
  });

  LegacySubscription.import = (configuration) => {
    if (configuration.repos) {
      return Promise.all(configuration.repos.map(repo => LegacySubscription.create({
        channelSlackId: configuration.channel_id,
        authorSlackId: configuration.user_id,
        workspaceSlackId: configuration.team_id,
        repoGitHubId: repo.id,
        repoFullName: repo.full_name,
      })));
    }
  };

  return LegacySubscription;
};
