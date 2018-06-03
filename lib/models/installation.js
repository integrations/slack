const logger = require('../logger');

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
      return Installation.install(data);
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

    async assertPermissions(github, { owner, repo, permissions }) {
      // Expects permissions in the form of for example { issues: 'write', pull_requests: 'write' }

      let data;
      try {
        ({ data } = await github.request({
          method: 'GET',
          url: '/repos/:owner/:repo/installation',
          headers: {
            accept: 'application/vnd.github.machine-man-preview+json',
          },
          owner,
          repo,
        }));
      } catch (err) {
        if (!(err.code && err.code === 404)) {
          throw err;
        }
        logger.debug({ err, owner, repo }, 'Could not find installation');
        return false;
      }

      const hasPermissions = Object.keys(permissions).every(key => (
        permissions[key] === data.permissions[key]
      ));

      logger.debug({
        owner,
        repo,
        expected: permissions,
        actual: data.permissions,
        hasPermissions,
      }, 'Verifying permissions for installation');

      return hasPermissions;
    },
  });


  return Installation;
};
