
module.exports = (sequelize, DataTypes) => {
  const SlackUser = sequelize.define('SlackUser', {
    slackId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: 'userWorkspaceUniqueConstraint', // slackId and slackWorspaceId need to be unique together
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
  return SlackUser;
};
