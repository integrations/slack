const moment = require('moment');

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
            unfurlPrivateResources: {},
            muteUnfurlPromptsUntil: null,
            muteUnfurlPromptsIndefinitely: false,
            unfurlPromptsDismissCount: 0,
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
    allowsAutomaticUnfurl(resourceId, channelId) {
      if (!this.settings.unfurlPrivateResources[resourceId]) {
        return false;
      }
      return (
        this.settings.unfurlPrivateResources[resourceId].includes('all') ||
        this.settings.unfurlPrivateResources[resourceId].includes(channelId)
      );
    },

    async setAutomaticUnfurl(resourceId, value) {
      const { unfurlPrivateResources } = this.settings;
      if (Object.keys(unfurlPrivateResources).includes(resourceId)) {
        unfurlPrivateResources[resourceId].push(value);
      } else {
        unfurlPrivateResources[resourceId] = [value];
      }
      await this.update({
        settings: {
          unfurlPrivateResources,
        },
      });
    },

    hasUnfurlPromptsMuted() {
      if (this.settings.muteUnfurlPromptsIndefinitely) {
        return true;
      }
      if (
        this.settings.muteUnfurlPromptsUntil &&
        moment.unix(this.settings.muteUnfurlPromptsUntil) > moment()
      ) {
        return true;
      }
      return false;
    },

    async shouldPromptToMute() {
      const DISMISSES_CAUSING_MUTE_PROMPT = 5;
      await this.update({
        settings: {
          unfurlPromptsDismissCount: this.settings.unfurlPromptsDismissCount + 1,
        },
      });
      // Every 5 times a user has dimissed the prompt, they will be asked whether they want to mute
      return this.settings.unfurlPromptsDismissCount % DISMISSES_CAUSING_MUTE_PROMPT === 0;
    },
  });
  return SlackUser;
};
