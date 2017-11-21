
module.exports = (sequelize, DataTypes) => {
  const GitHubUser = sequelize.define('GitHubUser', {
    githubId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
  });

  GitHubUser.associate = (models) => {
    GitHubUser.belongsTo(models.User);
  };
  return GitHubUser;
};
