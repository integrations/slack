const { Public } = require('../messages/public');

module.exports = async (context, subscription, slack) => {
  const res = await slack.chat.postMessage(
    subscription.channelId, '',
    new Public(context.payload).toJSON(),
  );
  context.log(res, 'Posted Slack message');
};
