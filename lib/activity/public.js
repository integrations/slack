const { Public } = require('../messages/public');

module.exports = async (context, subscription, slackWorkspace) => {
  const res = await slackWorkspace.botClient.chat.postMessage({
    channel: subscription.channelId,
    ...new Public(context.payload).toJSON(),
  });
  context.log(res, 'Posted Slack message');
};
