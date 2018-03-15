module.exports = (sequelize, DataTypes) => {
  const Unfurl = sequelize.define('Unfurl', {
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    channelSlackId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userSlackId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    githubType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isCondensed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
  });

  Unfurl.associate = (models) => {
    Unfurl.belongsTo(models.SlackWorkspace, {
      foreignKey: 'slackWorkspaceId',
      allowNull: false,
    });
  };

  Object.assign(Unfurl, {
    async log(
      slackWorkspaceId,
      userSlackId,
      channelSlackId,
      githubType,
      url,
      isCondensed,
      isPublic,
    ) {
      return this.create({
        slackWorkspaceId,
        userSlackId,
        channelSlackId,
        githubType,
        url,
        isCondensed,
        isPublic,
      });
    },
  });

  return Unfurl;
};
