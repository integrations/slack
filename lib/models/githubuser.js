// FIXME: Update probot to expose public APIs for this
const GitHub = require('probot/lib/github');
const logger = require('probot/lib/logger');
const Sequelize = require('sequelize');
const EncryptedField = require('sequelize-encrypted');

const encrypted = EncryptedField(Sequelize, process.env.STORAGE_SECRET);

module.exports = (sequelize, DataTypes) => {
  const GitHubUser = sequelize.define('GitHubUser', {
    // Store secrets in an encrypted field in the database
    secrets: encrypted.vault('secrets'),

    // Virtual attribute that reads from encrypted secrets field
    encryptedAccessToken: encrypted.field('accessToken', {
      type: DataTypes.STRING,
      allowNull: false,
    }),

    // unecrypted field that will be deleted soon
    accessToken: {
      type: DataTypes.STRING,
      allowNull: false,
      get() {
        return this.getDataValue('encryptedAccessToken') || this.getDataValue('accessToken');
      },
      set(value) {
        // write to both the encrypted and unencrypted field
        this.setDataValue('accessToken', value);
        this.setDataValue('encryptedAccessToken', value);
      },
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

    toJSON() {
      const { ...values } = this.dataValues;
      delete values.secrets;
      delete values.encryptedAccessToken;
      delete values.accessToken;
      return values;
    },
  });

  return GitHubUser;
};
