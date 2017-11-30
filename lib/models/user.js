
module.exports = (sequelize) => {
  const User = sequelize.define('User');

  User.associate = (models) => {
    User.hasOne(models.GitHubUser, {
      foreignKey: 'userId',
    });
    User.hasMany(models.SlackUser, {
      foreignKey: 'userId',
    });
  };
  return User;
};
