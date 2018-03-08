
module.exports = (sequelize, DataTypes) => {
  const SlackUser = sequelize.define('SlackUser', {
    slackId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: 'userWorkspaceUniqueConstraint', // slackId and slackWorspaceId need to be unique together
    },
  });

  let GitHubUser;
  let SlackWorkspace;

  SlackUser.associate = (models) => {
    GitHubUser = models.GitHubUser;
    SlackWorkspace = models.SlackWorkspace;

    SlackUser.belongsTo(GitHubUser, {
      foreignKey: 'githubId',
    });

    SlackUser.belongsTo(SlackWorkspace, {
      foreignKey: 'slackWorkspaceId',
      unique: 'userWorkspaceUniqueConstraint',
    });
  };

  SlackUser.lookup = function lookup(workspaceId, userId) {
    return SlackUser.findOne({
      where: { slackId: userId },
      include: [
        GitHubUser,
        { model: SlackWorkspace, where: { slackId: workspaceId } },
      ],
    });
  };

  return SlackUser;
};
