/* eslint-disable no-restricted-syntax, no-await-in-loop */
const { ActivateLegacySubscriptions } = require('./renderer/flow');

module.exports = async (req, res) => {
  const { LegacySubscription, SlackWorkspace } = res.locals.robot.models;

  req.log('Importing data', req.body);

  const subscriptionsByChannel = {};
  for (const configuration of req.body.event.configs) {
    await LegacySubscription.import(configuration);
    // Make sure we only send one message per channel
    if (!subscriptionsByChannel[configuration.channel_id]) {
      subscriptionsByChannel[configuration.channel_id] = [];
    }
    subscriptionsByChannel[configuration.channel_id].push(...configuration.repos.map(repo => ({
      authorSlackId: configuration.user_id,
      repoFullName: repo.full_name,
    })));
    // remove duplicate subscriptions
    // eslint-disable-next-line max-len
    subscriptionsByChannel[configuration.channel_id] = subscriptionsByChannel[configuration.channel_id]
      .filter((subscription, index, self) => (
        index === self.findIndex(s => (
          s.authorSlackId === subscription.authorSlackId &&
          s.repoFullName === subscription.repoFullName
        ))
      ));
  }

  const workspace = await SlackWorkspace.findOne({
    where: { slackId: req.body.team_id },
  });
  req.log.debug(subscriptionsByChannel, 'Prompting to reactivate subscriptions');
  await Promise.all(Object.keys(subscriptionsByChannel).map(async (channelId) => {
    const message = new ActivateLegacySubscriptions(subscriptionsByChannel[channelId]).toJSON();
    const slackRes = await workspace.client.chat.postMessage(channelId, '', message);
    req.log(slackRes, 'Posted Slack message');
  }));

  return res.sendStatus(200);
};
