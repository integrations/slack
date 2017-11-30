
module.exports = (sequelize, DataTypes) => {
  const Subscription = sequelize.define('Subscription', {
    githubId: DataTypes.BIGINT,
    channelId: DataTypes.STRING,
  });

  Object.assign(Subscription, {
    async lookup(githubId) {
      return (await this.findAll({ where: { githubId } }))
        .map(subscription => subscription.channelId);
    },

    async subscribe(githubId, channelId) {
      await this.findOrCreate({ where: { githubId, channelId } });
    },

    async unsubscribe(githubId, channelId) {
      await this.destroy({ where: { githubId, channelId } });
    },
  });

  return Subscription;
};
