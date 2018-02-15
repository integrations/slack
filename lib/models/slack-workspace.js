
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
  return SlackWorkspace;
};
