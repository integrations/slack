const { Subscription, SlackWorkspace } = require('../models');

module.exports = async (req, res) => {
  req.log('App uninstalled. Deleting subscriptions', req.body);

  const workspace = await SlackWorkspace.findOne({
    where: { slackId: req.body.team_id },
  });

  const subscriptions = await Subscription.findAll({
    where: {
      slackWorkspaceId: workspace.id,
    },
  });

  if (subscriptions) {
    await Promise.all(subscriptions.map(subscription => subscription.destroy()));
    req.log(`Deleted ${subscriptions.length} subscriptions`, req.body);
  }


  return res.sendStatus(200);
};
