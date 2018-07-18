const { Public } = require('../messages/public');

module.exports = async (context, subscription, channel) => {
  await channel.post(new Public(context.payload).toJSON());
};
