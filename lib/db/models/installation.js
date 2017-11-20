
module.exports = (sequelize, DataTypes) => {
  const Installation = sequelize.define('Installation', {
    githubId: DataTypes.BIGINT,
    ownerId: DataTypes.BIGINT,
  });
  return Installation;
};
