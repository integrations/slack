const cache = require('../cache');
const { Comment } = require('../messages/comment');

module.exports = async (context, subscription, slack) => {
  const { repository } = context.payload;

  const issue = context.payload.issue || context.payload.pull_request;

  // Fetch updated comment to get body_html
  const comment = (await context.github.issues.getComment(context.repo({
    id: context.payload.comment.id,
    headers: { accept: 'application/vnd.github.html+json' },
  }))).data;

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
