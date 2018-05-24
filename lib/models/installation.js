
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
    async getForOwner(ownerId) {
      return this.findOne({ where: { ownerId } });
    },

    async sync(github, { owner, repo }) {
      if (repo) {
        const { data } = await github.app.request({
          method: 'GET',
          url: '/repos/:owner/:repo/installation',
          headers: {
            accept: 'application/vnd.github.machine-man-preview+json',
          },
          owner,
          repo,
        });

        // Reuse install, which already does a findOrCreate
        return Installation.install(data);
      } else if (github.user) {
        return Installation.getForOwner((await github.user.users.getForUser({
          username: owner,
        })).data.id);
      }
    },

    async install(payload) {
      const [installation, created] = await Installation.findOrCreate({
        where: { ownerId: payload.account.id },
        defaults: { githubId: payload.id },
      });

      if (!created) {
        await installation.update({ githubId: payload.id });
      }

      return installation;
    },

    async uninstall(payload) {
      return Installation.destroy({ where: { ownerId: payload.account.id } });
    },
  });


  return Installation;
};
