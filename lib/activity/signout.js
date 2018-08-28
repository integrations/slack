const getRepositories = require('../github/get-repositories');
const { Subscription } = require('../models');
const ReEnableMultipleSubscriptions = require('../messages/flow/re-enable-multiple-subscriptions');

module.exports = async (robot, slackUser, slackWorkspace) => {
  const deletedSubscriptions = await slackUser.signout();

  if (deletedSubscriptions) {
    const subscriptionsByChannel = Subscription.groupByChannel(deletedSubscriptions);

    await Promise.all(Object.keys(subscriptionsByChannel).map(async (channel) => {
      const subscriptions = subscriptionsByChannel[channel];
      const repositories = await getRepositories(subscriptions, robot);
      if (repositories) {
        const attachment = new ReEnableMultipleSubscriptions(repositories, slackUser.slackId, 'disconnected their GitHub account').getAttachment();
        return slackWorkspace.client.chat.postMessage({
          channel,
          attachments: [attachment],
        });
      }
    }));
  }
};
