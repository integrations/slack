/* eslint-disable no-restricted-syntax, no-await-in-loop */
const { ActivateLegacySubscriptions } = require('./renderer/flow');
const slack = require('./client');

module.exports = async (req, res) => {
  const { LegacySubscription, SlackWorkspace } = res.locals.robot.models;

  req.log('Importing data', req.body);

  const subscriptionsByChannel = {};
  for (const configuration of req.body.event.configs) {
    await LegacySubscription.import(configuration);
    // Make sure we only send one message per channel
    subscriptionsByChannel[configuration.channel_id] = configuration.repos.map(repo => ({
      authorSlackId: configuration.user_id,
      repoFullName: repo.full_name,
    }));
  }

  const workspace = await SlackWorkspace.findOne({
    where: { slackId: req.body.team_id },
  });
  const client = slack.createClient(workspace.accessToken);
  req.log.debug(subscriptionsByChannel, 'Prompting to reactivate subscriptions');
  Object.keys(subscriptionsByChannel).forEach(async (channelId) => {
    const message = new ActivateLegacySubscriptions(subscriptionsByChannel[channelId]).toJSON();
    const slackRes = await client.chat.postMessage(channelId, '', message);
    req.log(slackRes, 'Posted Slack message');
  });

  return res.sendStatus(200);
};
