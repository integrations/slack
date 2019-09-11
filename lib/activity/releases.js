const { Release } = require('../messages/release');

async function releaseEvent(context, subscription, slackWorkspace) {
  const eventType = `${context.event}.${context.payload.action}`;

  if (eventType === 'release.published') {
    const release = (await context.github.request({
      method: 'GET',
      url: context.payload.release.url,
      headers: { accept: 'application/vnd.github.html+json' },
    })).data;

    const releaseMessage = new Release({
      eventType,
      release,
      repository: context.payload.repository,
    });

    const res = await slackWorkspace.botClient.chat.postMessage({
      channel: subscription.channelId,
      attachments: [releaseMessage.getRenderedMessage()],
    });
    context.log(res, 'Posted Slack message');
  }
}

module.exports = {
  releaseEvent,
};
