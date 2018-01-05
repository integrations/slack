
module.exports = (sequelize, DataTypes) => {
  const Subscription = sequelize.define('Subscription', {
    githubId: DataTypes.BIGINT,
    channelId: DataTypes.STRING,
  });

  Subscription.associate = (models) => {
    Subscription.SlackWorkspace = Subscription.belongsTo(models.SlackWorkspace, {
      foreignKey: 'slackWorkspaceId',
    });
    Subscription.Installation = Subscription.belongsTo(models.Installation, {
      foreignKey: 'installationId',
      allowNull: true,
    });
  };

  Object.assign(Subscription, {
    async lookup(githubId) {
      return this.findAll({
        where: { githubId },
        include: [Subscription.SlackWorkspace, Subscription.Installation],
      });
    },

    async subscribe(githubId, channelId, slackWorkspaceId, installationId) {
      const [record, created] = await this.findOrCreate({
        where: { githubId, channelId, slackWorkspaceId },
        defaults: { installationId },
      });
      if (!created) {
        // If subscription already exists, update installationId to help with backfill
        await record.update({ installationId });
      }
      return record;
    },

    async unsubscribe(githubId, channelId, slackWorkspaceId) {
      await this.destroy({ where: { githubId, channelId, slackWorkspaceId } });
    },
  });

  return Subscription;
};
