const Sequelize = require('sequelize');
const EncryptedField = require('sequelize-encrypted');

const slack = require('../slack/client');

if (!process.env.STORAGE_SECRET) {
  throw new Error('STORAGE_SECRET is not defined.');
}

const encrypted = EncryptedField(Sequelize, process.env.STORAGE_SECRET);

module.exports = (sequelize, DataTypes) => {
  const SlackWorkspace = sequelize.define('SlackWorkspace', {
    slackId: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    // Store secrets in an encrypted field in the database
    secrets: encrypted.vault('secrets'),

    // Virtual attribute that reads from encrypted secrets field
    accessToken: encrypted.field('accessToken', {
      type: DataTypes.STRING,
      allowNull: false,
    }),

    // Virtual attribute that reads from encrypted secrets field
    botAccessToken: encrypted.field('botAccessToken', {
      type: DataTypes.STRING,
      allowNull: false,
    }),
  });

  SlackWorkspace.associate = (models) => {
    SlackWorkspace.hasMany(models.SlackUser, {
      foreignKey: 'slackWorkspaceId',
    });
  };

  Object.defineProperty(SlackWorkspace.prototype, 'userClient', {
    get: function client() {
      return slack.createClient(this.accessToken);
    },
  });

  Object.defineProperty(SlackWorkspace.prototype, 'botClient', {
    get: function client() {
      return slack.createClient(this.botAccessToken);
    },
  });

  Object.assign(SlackWorkspace.prototype, {
    toJSON() {
      const { ...values } = this.dataValues;
      delete values.secrets;
      delete values.accessToken;
      delete values.botAccessToken;
      return values;
    },
  });

  return SlackWorkspace;
};
