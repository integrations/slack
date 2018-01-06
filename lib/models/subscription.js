
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
      allowNull: false,
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
      const [record] = await this.findOrCreate({
        where: { githubId, channelId, slackWorkspaceId, installationId },
      });
      return record;
    },

    async unsubscribe(githubId, channelId, slackWorkspaceId) {
      await this.destroy({ where: { githubId, channelId, slackWorkspaceId } });
    },
  });

  return Subscription;
};
