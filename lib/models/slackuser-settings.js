module.exports = (sequelize, DataTypes) => {
  const SlackUserSettings = sequelize.define('SlackUserSettings', {
    unfurlAllPrivateLinks: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    unfurlPrivateRepos: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
    },
    muteUnfurlPromptsUntil: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: true,
    },
    muteUnfurlPromptsIndefinitely: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: true,
    },
  });

  SlackUserSettings.associate = (models) => {
    SlackUserSettings.belongsTo(models.SlackUser, {
      foreignKey: 'slackUserId',
      allowNull: false,
    });
  };


  return SlackUserSettings;
};
