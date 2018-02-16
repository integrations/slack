const GitHub = require('probot/lib/github');
const logger = require('probot/lib/logger');

module.exports = (sequelize, DataTypes) => {
  const Installation = sequelize.define('Installation', {
    githubId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: 'installationOwnerUniqueConstraint',
    },
    ownerId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: 'installationOwnerUniqueConstraint',
    },
  });

  Installation.associate = (models) => {
    Installation.hasMany(models.Subscription, {
      foreignKey: 'installationId',
      onDelete: 'cascade',
      hooks: 'true',
    });
  };

  Object.assign(Installation, {
    async getByUsername(username) {
      // FIXME: need an anuthenticated client, but authenticating as app doesn't work
      // const github = await robot.auth();
      const github = new GitHub({ logger });

      // @todo: Temporary workaround (should not use GITHUB_TOKEN)
      if (process.env.GITHUB_TOKEN) {
        github.authenticate({
          type: 'token',
          token: process.env.GITHUB_TOKEN,
        });
      }

      const owner = (await github.users.getForUser({ username })).data;

      return [owner, await Installation.getForOwner(owner.id)];
    },

    async getForOwner(ownerId) {
      return this.findOne({ where: { ownerId } });
    },
  });

  return Installation;
};
