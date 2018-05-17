
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
      const { data } = await github.request({
        method: 'GET',
        url: '/repos/:owner/:repo/installation',
        headers: {
          accept: 'application/vnd.github.machine-man-preview+json',
        },
        owner,
        repo,
      });

      // Reuse install, which already does a findOrCreate
      const installation = await Installation.install(data);

      // Make API data available
      installation.permissions = data.permissions;
      installation.html_url = data.html_url;

      return installation;
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
