const { Push } = require('../../slack/renderer/push');

async function push(context, subscription, slack) {
  if (
      context.payload.repository.default_branch ===
      context.payload.ref.replace('refs/heads/', '')
  ) {
    const pushMessage = new Push({
      push: context.payload,
    });

    const res = await slack.chat.postMessage(subscription.channelId, '', pushMessage.getRenderedMessage());
    context.log(res, 'Posted Slack message');
  }
}

module.exports = {
  push,
};
