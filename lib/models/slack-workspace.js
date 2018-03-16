const Sequelize = require('sequelize');
const EncryptedField = require('sequelize-encrypted');

const slack = require('../slack/client');

const encrypted = EncryptedField(Sequelize, process.env.STORAGE_SECRET);

module.exports = (sequelize, DataTypes) => {
  const SlackWorkspace = sequelize.define('SlackWorkspace', {
    slackId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    // Store secrets in an encrypted field in the database
    secrets: encrypted.vault('secrets'),

    // Virtual attribute that reads from encrypted secrets field
    encryptedAccessToken: encrypted.field('accessToken', {
      type: DataTypes.STRING,
    }),

    // unecrypted field that will be deleted soon
    unencryptedAccessToken: {
      type: DataTypes.STRING,
      field: 'accessToken',
    },

    // virtual field that reads and writes both access tokens
    accessToken: {
      type: DataTypes.VIRTUAL,
      allowNull: false,
      get() {
        return this.encryptedAccessToken || this.unencryptedAccessToken;
      },
      set(value) {
        // write to both the encrypted and unencrypted field
        this.encryptedAccessToken = value;
        this.unencryptedAccessToken = value;
      },
    },
  });

  SlackWorkspace.associate = (models) => {
    SlackWorkspace.hasMany(models.SlackUser, {
      foreignKey: 'slackWorkspaceId',
    });
  };

  Object.defineProperty(SlackWorkspace.prototype, 'client', {
    get: function client() {
      return slack.createClient(this.accessToken);
    },
  });

  Object.assign(SlackWorkspace.prototype, {
    toJSON() {
      const { ...values } = this.dataValues;
      delete values.secrets;
      delete values.accessToken;
      return values;
    },
  });

  return SlackWorkspace;
};
