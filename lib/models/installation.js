
module.exports = (sequelize, DataTypes) => {
  const Installation = sequelize.define('Installation', {
    githubId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: 'installationOwnerUniqueConstraint',
    },
    ownerId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: 'installationOwnerUniqueConstraint',
    },
  });

  Installation.associate = (models) => {
    Installation.hasMany(models.Subscription, {
      foreignKey: 'installationId',
      onDelete: 'cascade',
      hooks: 'true',
    });
  };

  Installation.getForOwner = async function (ownerId) {
    return this.findOne({ where: { ownerId } });
  };

  return Installation;
};
