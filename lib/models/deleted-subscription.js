module.exports = (sequelize, DataTypes) => {
  const DeletedSubscription = sequelize.define('DeletedSubscription', {
    githubId: DataTypes.BIGINT,
    // Storing only for debugging purposes. Do not use for querying data since it might change
    githubName: DataTypes.STRING,
    channelId: DataTypes.STRING,
    type: DataTypes.STRING,
    settings: DataTypes.JSON,
    reason: DataTypes.STRING,
    deletedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {});
  DeletedSubscription.associate = (models) => {
    DeletedSubscription.SlackWorkspace = DeletedSubscription.belongsTo(models.SlackWorkspace, {
      foreignKey: 'slackWorkspaceId',
    });
    DeletedSubscription.Installation = DeletedSubscription.belongsTo(models.Installation, {
      foreignKey: 'installationId',
      allowNull: false,
    });
    DeletedSubscription.Creator = DeletedSubscription.belongsTo(models.SlackUser, {
      foreignKey: 'creatorId',
      allowNull: true,
    });
  };
  return DeletedSubscription;
};
