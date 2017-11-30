
module.exports = (sequelize, DataTypes) => {
  const SlackUser = sequelize.define('SlackUser', {
    slackId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });

  SlackUser.associate = (models) => {
    SlackUser.belongsTo(models.User, {
      foreignKey: 'userId',
    });
  };
  return SlackUser;
};
