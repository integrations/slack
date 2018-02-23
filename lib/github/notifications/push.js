const { Push } = require('../../messages/push');

async function push(context, subscription, slack) {
  if (
    context.payload.repository.default_branch ===
      context.payload.ref.replace('refs/heads/', '') ||
      subscription.settings.commits === 'all'
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
