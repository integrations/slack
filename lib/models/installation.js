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
      const options = repo
        ? {
          method: 'GET',
          url: '/repos/:owner/:repo/installation',
          headers: {
            accept: 'application/vnd.github.machine-man-preview+json',
          },
          owner,
          repo,
        }
        : {
          method: 'GET',
          url: '/users/:username/installation',
          headers: {
            accept: 'application/vnd.github.machine-man-preview+json',
          },
          username: owner,
        };
      const { data } = await github.request(options);
      // Reuse install, which already does a findOrCreate
      const installation = await Installation.install(data);

      // Make API data available
      installation.permissions = data.permissions;
      installation.html_url = data.html_url;

      return installation;
    },

    async install(payload) {
      // We don't use findOrCreate here because sequelize crashes
      // when trying to provide a meaningful error when there's
      // a race condition and a record matching the "where" is inserted
      // right after not finding it.
      // This internal sequelize error happens becuase we have a unique
      // constraint on two columns (ownerId and githubId) but we
      // only use ownerId in the `where` clause
      let installation = await Installation.findOne({
        where: { ownerId: payload.account.id },
      });
      if (!installation) {
        installation = await Installation.create({
          ownerId: payload.account.id,
          githubId: payload.id,
        });
      } else {
        await installation.update({ githubId: payload.id });
      }
      return installation;
    },

    async uninstall(payload) {
      return Installation.destroy({
        where: { ownerId: payload.account.id },
        individualHooks: true,
      });
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

  Installation.hook('beforeDestroy', async (installation) => {
    // Manual deletion to trigger the Subscription hooks.
    // It's only needed for that because the deletion is also configured to cascade.
    // And that's why this is run in `beforeDestroy` and not `afterDestroy`
    // because otherwise subscriptions would have been already deleted
    await sequelize.model('Subscription').destroy({
      where: {
        installationId: installation.id,
      },
      individualHooks: true,
    });
  });

  return Installation;
};
