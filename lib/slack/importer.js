/* eslint-disable no-restricted-syntax, no-await-in-loop */
const { LegacySubscription, SlackWorkspace } = require('../models');
const { ActivateLegacySubscriptions } = require('../messages/flow');

module.exports = async (req, res) => {
  req.log('Importing data', req.body);

  const subscriptions = await LegacySubscription.importAll(req.body.event.configs);
  const subscriptionsByChannel = LegacySubscription.groupByChannel(subscriptions);

  const workspace = await SlackWorkspace.findOne({
    where: { slackId: req.body.team_id },
  });
  req.log.debug({ subscriptions: subscriptionsByChannel }, 'Prompting to reactivate subscriptions');
  await Promise.all(Object.keys(subscriptionsByChannel).map(async (channelId) => {
    if (subscriptionsByChannel[channelId].length !== 0) {
      const message = new ActivateLegacySubscriptions(subscriptionsByChannel[channelId]).toJSON();
      const slackRes = await workspace.client.chat.postMessage({
        channel: channelId,
        ...message,
      });
      req.log(slackRes, 'Posted Slack message');
    } else {
      req.log.warn(
        req.body.event.configs,
        'Didn\'t post prompt to reactivate, because there were no subscriptions',
      );
    }
  }));

  return res.sendStatus(200);
};
