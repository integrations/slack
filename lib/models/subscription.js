
module.exports = (sequelize, DataTypes) => {
  const Subscription = sequelize.define('Subscription', {
    githubId: DataTypes.BIGINT,
    channelId: DataTypes.STRING,
    disabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    disableReason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  });

  Subscription.associate = (models) => {
    Subscription.SlackWorkspace = Subscription.belongsTo(models.SlackWorkspace, {
      foreignKey: 'slackWorkspaceId',
    });
    Subscription.Installation = Subscription.belongsTo(models.Installation, {
      foreignKey: 'installationId',
      allowNull: true,
    });
    Subscription.Creator = Subscription.belongsTo(models.SlackUser, {
      foreignKey: 'creatorId',
      allowNull: true,
    });
  };

  Object.assign(Subscription.prototype, {
    cacheKey(...parts) {
      return [`subscription#${this.id}`].concat(parts).join(':');
    },
  });

  Object.assign(Subscription, {
    async lookup(githubId) {
      return this.findAll({
        where: { githubId, disabled: false },
        include: [Subscription.SlackWorkspace, Subscription.Installation],
      });
    },

    async lookupOne(githubId, channelId, slackWorkspaceId) {
      return this.findOne({
        where: {
          githubId,
          channelId,
          slackWorkspaceId,
          disabled: false,
        },
      });
    },

    async subscribe({
      githubId, channelId, slackWorkspaceId, installationId, creatorId,
    }) {
      if (!creatorId) {
        // Effectively enforcing not-null constaint at app level
        throw Error('Need to pass creatorId for new subscriptions');
      }
      const [subscription, created] = await this.findOrCreate({
        where: {
          githubId, channelId, slackWorkspaceId, installationId,
        },
        defaults: {
          creatorId,
        },
      });
      if (!created) {
        subscription.disabled = false;
        subscription.disableReason = null;
        await subscription.save();
      }
      return subscription;
    },

    async unsubscribe(githubId, channelId, slackWorkspaceId) {
      await this.update({
        disabled: true,
        disableReason: 'unsubscribed',
      }, { where: { githubId, channelId, slackWorkspaceId } });
    },
  });

  return Subscription;
};
