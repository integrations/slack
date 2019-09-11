const { Ref } = require('../messages/ref');

module.exports = async (context, subscription, slackWorkspace) => {
  const res = await slackWorkspace.botClient.chat.postMessage({
    channel: subscription.channelId,
    ...new Ref({
      event: context.event,
      ...context.payload,
    }).toJSON(),
  });
  context.log(res, 'Posted Slack message');
};
