const { Public } = require('../messages/public');

async function publicEvent(context, subscription, slack) {
  const publicMessage = new Public({
    publicEvent: context.payload,
  });

  const res = await slack.chat.postMessage(subscription.channelId, '', publicMessage.toJSON());
  context.log(res, 'Posted Slack message');
}

module.exports = {
  publicEvent,
};
