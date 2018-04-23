const cache = require('../cache');
const { Comment } = require('../messages/comment');

module.exports = async (context, subscription, slack) => {
  const { repository } = context.payload;

  const issue = context.payload.issue || context.payload.pull_request;

  let { comment } = context.payload;

  // Fetch updated comment to get body_html
  try {
    comment = (await context.github.request({
      method: 'GET',
      url: context.payload.comment.url,
      headers: { accept: 'application/vnd.github.html+json' },
    })).data;
  } catch (err) {
    // Review comments API is not yet accessible by GitHub Apps
    if (err.code !== 403) {
      throw err;
    }
  }

  const attachments = [
    new Comment({ comment, issue, repository }).getRenderedMessage(),
  ];

  const cacheKey = subscription.cacheKey(`comment#${context.payload.comment.id}`);
  const storedMetaData = await cache.get(cacheKey);

  if (storedMetaData) {
    const { ts, channel } = storedMetaData;
    const res = await slack.chat.update({ ts, channel, attachments });
    context.log(res, 'Updated Slack message');
  } else if (context.payload.action === 'created') {
    const res = await slack.chat.postMessage({ channel: subscription.channelId, attachments });
    context.log(res, 'Posted Slack message');
    const messageMetaData = {
      channel: res.channel,
      ts: res.ts,
    };
    await cache.set(cacheKey, messageMetaData);
  }
};
