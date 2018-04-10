
module.exports = (sequelize, DataTypes) => {
  const SlackUser = sequelize.define('SlackUser', {
    slackId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: 'userWorkspaceUniqueConstraint', // slackId and slackWorspaceId need to be unique together
    },

    settings: {
      type: DataTypes.JSON,
      get() {
        if (!this.getDataValue('settings')) {
          this.setDataValue('settings', {
            unfurlAllPrivateLinks: false,
            unfurlPrivateRepos: [],
            muteUnfurlPromptsUntil: null,
            muteUnfurlPromptsIndefinitely: false,
          });
        }
        return this.getDataValue('settings');
      },

      set(settings) {
        Object.assign(this.settings, settings);
        this.changed('settings', true);
      },
    },
  });

  SlackUser.associate = (models) => {
    SlackUser.belongsTo(models.GitHubUser, {
      foreignKey: 'githubId',
    });
    SlackUser.belongsTo(models.SlackWorkspace, {
      foreignKey: 'slackWorkspaceId',
      unique: 'userWorkspaceUniqueConstraint',
    });
  };

  Object.assign(SlackUser.prototype, {
    allowsAutomaticUnfurl(repoId) {
      return (
        this.settings.unfurlAllPrivateLinks ||
        this.settings.unfurlPrivateRepos.includes(repoId)
      );
    },
  });
  return SlackUser;
};
