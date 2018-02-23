const { Ref } = require('../../messages/ref');

module.exports = async (context, subscription, slack) => {
  const res = await slack.chat.postMessage(
    subscription.channelId,
    '',
    new Ref({
      event: context.event,
      ...context.payload,
    }).toJSON(),
  );
  context.log(res, 'Posted Slack message');
};
