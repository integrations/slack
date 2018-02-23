const cache = require('../../cache');
const { Comment } = require('../../messages/comment');

module.exports = async (context, subscription, slack) => {
  const { comment, issue, repository } = context.payload;

  // Get rendered message
  const message = {
    attachments: [
      new Comment({ comment, issue, repository }).getRenderedMessage(),
    ],
  };

  const cacheKey = subscription.cacheKey(`comment#${context.payload.comment.id}`);
  const storedMetaData = await cache.get(cacheKey);

  if (storedMetaData) {
    const res = await slack.chat.update(storedMetaData.ts, storedMetaData.channel, '', message);
    context.log(res, 'Updated Slack message');
  } else if (context.payload.action === 'created') {
    const res = await slack.chat.postMessage(subscription.channelId, '', message);
    context.log(res, 'Posted Slack message');
    const messageMetaData = {
      channel: res.channel,
      ts: res.ts,
    };
    await cache.set(cacheKey, messageMetaData);
  }
};
