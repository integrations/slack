const GitHub = require('github');

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
      const github = new GitHub();
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
          throw err;
        });
    },
  });

  return GitHubUser;
};
