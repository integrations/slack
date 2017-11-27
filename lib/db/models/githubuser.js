
module.exports = (sequelize, DataTypes) => {
  const GitHubUser = sequelize.define('GitHubUser', {
    githubId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    accessToken: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });

  GitHubUser.associate = (models) => {
    GitHubUser.belongsTo(models.User, {
      foreignKey: 'userId',
    });
  };
  return GitHubUser;
};
