// FIXME: Update probot to expose public APIs for this
const GitHub = require('probot/lib/github');
const logger = require('probot/lib/logger');

module.exports = (sequelize, DataTypes) => {
  const GitHubUser = sequelize.define('GitHubUser', {
    accessToken: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });

  GitHubUser.associate = (models) => {
    GitHubUser.hasMany(models.SlackUser, { foreignKey: 'githubId' });
  };

  Object.defineProperty(GitHubUser.prototype, 'client', {
    get: function client() {
      const github = new GitHub({ logger });
      github.authenticate({
        token: this.accessToken,
        type: 'token',
      });
      return github;
    },
  });

  Object.assign(GitHubUser.prototype, {
    hasRepoAccess(repoId) {
      return this.client.repos.getById({ id: repoId.toString() })
        .then(() => true)
        .catch((err) => {
          if (err.code === 404) {
            return false;
          }
          logger.warn({ err, repoId, userId: this.id }, 'GitHub returned neither 200 nor 404');
          return true;
        });
    },
  });

  return GitHubUser;
};
