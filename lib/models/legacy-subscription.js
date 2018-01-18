module.exports = (sequelize, DataTypes) => {
  const LegacySubscription = sequelize.define('LegacySubscription', {
    workspaceSlackId: DataTypes.STRING,
    repoGitHubId: DataTypes.BIGINT,
    ownerGitHubId: DataTypes.BIGINT,
    repoName: DataTypes.STRING,
    ownerName: DataTypes.STRING,
    authorSlackId: DataTypes.STRING,
    channelSlackId: DataTypes.STRING,
  });

  LegacySubscription.import = (configuration) => {
    if (configuration.repos) {
      return Promise.all(configuration.repos.map(repo => LegacySubscription.create({
        channelSlackId: configuration.channel,
        // authorSlackId: configuration.author,
        // workspaceSlackId: configuration.team,
        repoGitHubId: repo.id,
        ownerGitHubId: repo.owner.id,
        repoName: repo.name,
        ownerName: repo.owner.login,
      })));
    }
  };

  return LegacySubscription;
};
