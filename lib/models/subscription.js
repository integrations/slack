
module.exports = (sequelize, DataTypes) => {
  const Subscription = sequelize.define('Subscription', {
    githubId: DataTypes.BIGINT,
    channelId: DataTypes.STRING,
  });

  Subscription.associate = (models) => {
    Subscription.belongsTo(models.SlackWorkspace, {
      foreignKey: 'slackWorkspaceId',
    });
  };

  Object.assign(Subscription, {
    async lookup(githubId) {
      return this.findAll({ where: { githubId } });
    },

    async subscribe(githubId, channelId, slackWorkspaceId) {
      const [record] = await this.findOrCreate({
        where: { githubId, channelId, slackWorkspaceId },
      });
      return record;
    },

    async unsubscribe(githubId, channelId, slackWorkspaceId) {
      await this.destroy({ where: { githubId, channelId, slackWorkspaceId } });
    },
  });

  return Subscription;
};
