const { Ref } = require('../../slack/renderer/ref');

module.exports = async (context, subscription, slack) => {
  const {
    ref,
    sender,
    repository,
  } = context.payload;

  const refType = context.payload.ref_type;

  const res = await slack.chat.postMessage(
    subscription.channelId,
    '',
    new Ref({
      eventType: context.event,
      ref,
      refType,
      sender,
      repository,
    }).toJSON(),
  );
  context.log(res, 'Posted Slack message');
};
