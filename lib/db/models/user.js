
module.exports = (sequelize) => {
  const User = sequelize.define('User');

  User.associate = (models) => {
    User.hasOne(models.GitHubUser);
    User.hasMany(models.SlackUser);
  };
  return User;
};
