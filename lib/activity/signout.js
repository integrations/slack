const getRepositories = require('../github/get-repositories');
const getAccounts = require('../github/get-accounts');
const { Subscription } = require('../models');
const ReEnableMultipleSubscriptions = require('../messages/flow/re-enable-multiple-subscriptions');

module.exports = async (robot, slackUser, slackWorkspace) => {
  const deletedSubscriptions = await slackUser.signout();

  if (deletedSubscriptions) {
    const subscriptionsByChannel = Subscription.groupByChannel(deletedSubscriptions);

    await Promise.all(Object.keys(subscriptionsByChannel).map(async (channel) => {
      const subscriptions = subscriptionsByChannel[channel];
      const repositoriesPromise = getRepositories(subscriptions.filter(s => s.type === 'repo'), robot);
      const accountsPromise = getAccounts(subscriptions.filter(s => s.type === 'account'), robot);
      const repositories = await repositoriesPromise;
      const accounts = await accountsPromise;
      if (repositories.length > 0 || accounts.length > 0) {
        const attachment = new ReEnableMultipleSubscriptions(repositories, accounts, slackUser.slackId, 'disconnected their GitHub account').getAttachment();
        return slackWorkspace.client.chat.postMessage({
          channel,
          attachments: [attachment],
        });
      }
    }));
  }
};
