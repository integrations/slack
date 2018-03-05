const { Push } = require('../messages/push');

async function push(context, subscription, slack) {
  const isDefaultBranch = context.payload.repository.default_branch ===
    context.payload.ref.replace('refs/heads/', '');
  const allEnabled = subscription.settings.commits === 'all';
  const hasCommits = context.payload.commits.length > 0;

  if (hasCommits && (allEnabled || isDefaultBranch)) {
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
