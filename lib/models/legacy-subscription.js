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
  return LegacySubscription;
};
