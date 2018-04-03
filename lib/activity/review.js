const cache = require('../cache');
const { Review } = require('../messages/review');

module.exports = async (context, subscription, slack) => {
  if (
    context.payload.review.state === 'commented' &&
    context.payload.review.body === null
  ) {
    return;
  }

  // Fetch review to get body_html
  const review = (await context.github.pullRequests.getReview(context.issue({
    id: context.payload.review.id,
    headers: { accept: 'application/vnd.github.html+json' },
  }))).data;

  // Get rendered message
  const message = {
    attachments: [
      new Review({ ...context.payload, review }).toJSON(),
    ],
  };

  const cacheKey = subscription.cacheKey(`review#${context.payload.review.id}`);
  const storedMetaData = await cache.get(cacheKey);

  if (storedMetaData) {
    const { ts, channel } = storedMetaData;
    const res = await slack.chat.update({
      ts,
      channel,
      ...message,
    });
    context.log(res, 'Updated Slack message');
  } else if (context.payload.action === 'submitted') {
    const res = await slack.chat.postMessage({ channel: subscription.channelId, ...message });
    context.log(res, 'Posted Slack message');
    const messageMetaData = {
      channel: res.channel,
      ts: res.ts,
    };
    await cache.set(cacheKey, messageMetaData);
  }
};
