
module.exports = (sequelize, DataTypes) => {
  const Installation = sequelize.define('Installation', {
    githubId: DataTypes.BIGINT,
    ownerId: DataTypes.BIGINT,
  });

  Installation.getForOwner = async function (ownerId) {
    return this.findOne({ where: { ownerId } });
  };

  return Installation;
};
