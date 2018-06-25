const { Ref } = require('../messages/ref');

module.exports = async (context, subscription, slack) => {
  const onlyTags = subscription.settings.branches === 'tag';

  if (!onlyTags || context.payload.ref_type === 'tag') {
    const res = await slack.chat.postMessage({
      channel: subscription.channelId,
      ...new Ref({
        event: context.event,
        ...context.payload,
      }).toJSON(),
    });
    context.log(res, 'Posted Slack message');
  }
};
