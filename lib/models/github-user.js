// FIXME: Update probot to expose public APIs for this
const GitHub = require('probot/lib/github');
const logger = require('../logger');
const Sequelize = require('sequelize');
const EncryptedField = require('sequelize-encrypted');

const encrypted = EncryptedField(Sequelize, process.env.STORAGE_SECRET);

module.exports = (sequelize, DataTypes) => {
  const GitHubUser = sequelize.define('GitHubUser', {
    // Store secrets in an encrypted field in the database
    secrets: encrypted.vault('secrets'),

    // Virtual attribute that reads from encrypted secrets field
    accessToken: encrypted.field('accessToken', {
      type: DataTypes.STRING,
      allowNull: false,
    }),
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

    toJSON() {
      const { ...values } = this.dataValues;
      delete values.secrets;
      delete values.accessToken;
      return values;
    },
  });

  return GitHubUser;
};
