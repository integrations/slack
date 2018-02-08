const cache = require('../../cache');
const { Comment } = require('../../slack/renderer/comment');

module.exports = async (context, subscription, slack) => {
  const { issue, repository } = context.payload;

  // Fetch updated version of comment to retrieve body_html
  const comment = (await context.github.issues.getComment(context.repo({
    id: context.payload.comment.id,
    headers: { accept: 'application/vnd.github.html+json' },
  }))).data;

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
