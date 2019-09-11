const RepositoryDeleted = require('../messages/repository-deleted');

async function repositoryDeleted(context, subscription, slackWorkspace) {
  await slackWorkspace.botClient.chat.postMessage({
    channel: subscription.channelId,
    ...new RepositoryDeleted(context.payload).toJSON(),
  });
  if (subscription.type === 'repo') {
    await subscription.destroyWithReason('repository deleted');
  }
}

module.exports = {
  repositoryDeleted,
};
