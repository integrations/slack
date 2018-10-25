const RepositoryDeleted = require('../messages/repository-deleted');

async function repositoryDeleted(context, subscription, slack) {
  await slack.chat.postMessage({
    channel: subscription.channelId,
    ...new RepositoryDeleted(context.payload).toJSON(),
  });
  if (subscription.type === 'repo') {
    await subscription.destroy();
  }
}

module.exports = {
  repositoryDeleted,
};
