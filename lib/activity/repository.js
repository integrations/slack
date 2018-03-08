const RepositoryDeleted = require('../messages/repository-deleted');

async function repositoryDeleted(context, subscription, slack) {
  await slack.chat.postMessage(subscription.channelId, '', new RepositoryDeleted(context.payload).toJSON());
  await subscription.destroy();
}

module.exports = {
  repositoryDeleted,
};
