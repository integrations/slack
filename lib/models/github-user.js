// FIXME: Update probot to expose public APIs for this
const { GitHubAPI, ProbotOctokit } = require('../github/client');
const logger = require('../logger');
const Sequelize = require('sequelize');
const EncryptedField = require('sequelize-encrypted');

if (!process.env.STORAGE_SECRET) {
  throw new Error('STORAGE_SECRET is not defined.');
}

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

    // Storing only for debugging purposes. Do not use for querying data since it might change
    login: DataTypes.STRING,
  });

  GitHubUser.associate = (models) => {
    GitHubUser.hasMany(models.SlackUser, { foreignKey: 'githubId' });
  };

  Object.defineProperty(GitHubUser.prototype, 'client', {
    get: function client() {
      const github = GitHubAPI({
        Octokit: ProbotOctokit,
        logger,
        retry: {
          // disable retries to test error states
          enabled: false,
        },
        throttle: {
          // disabled to test upgrade behavior without Bottleneck
          enabled: false,
        },
      });
      github.authenticate({
        token: this.accessToken,
        type: 'token',
      });
      return github;
    },
  });

  Object.assign(GitHubUser.prototype, {
    hasRepoAccess(repoId) {
      // TODO: Make this a plugin
      // https://github.com/octokit/rest.js/issues/163#issuecomment-450007728
      return this.client.request('GET /repositories/:id', { id: repoId.toString() })
        .then(() => true)
        .catch((err) => {
          if (err.code === 404) {
            return false;
          }
          logger.warn({ err, repoId, userId: this.id }, 'GitHub returned neither 200 nor 404');
          throw err;
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
