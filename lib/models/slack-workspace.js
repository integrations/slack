const slack = require('../slack/client');

module.exports = (sequelize, DataTypes) => {
  const SlackWorkspace = sequelize.define('SlackWorkspace', {
    slackId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    accessToken: {
      type: DataTypes.STRING,
      allowNull: false,
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

  return SlackWorkspace;
};
