'use strict';
module.exports = (db, DataTypes) => {
  var Subscription = db.define('Subscription', {
    account_id: DataTypes.BIGINT,
    repository_id: DataTypes.BIGINT,
    team_id: DataTypes.STRING,
    channel_id: DataTypes.STRING
  }, {
    underscored: true,
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return Subscription;
};
