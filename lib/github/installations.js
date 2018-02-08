/**
 * Track GitHub App installations
 *
 *
 */
module.exports = (robot) => {
  const { Installation, Subscription } = robot.models;

  robot.on('installation.created', async (context) => {
    await Installation
      .findOrCreate({
        where: { ownerId: context.payload.installation.account.id },
        defaults: { githubId: context.payload.installation.id },
      })
      .then(([installation, created]) => {
        context.log({ created, installation }, 'GitHub App installed');
      });
  });

  robot.on('installation.deleted', async (context) => {
    const ownerId = context.payload.installation.account.id;
    const subscriptions = await Subscription.findAll({
      where: {
        installationId: context.payload.installation.id,
        disabled: false,
      },
    });
    // @todo: Post message to all channels where subscriptions are now disabled
    await Promise.all(subscriptions.map((subscription) => {
      /* eslint-disable no-param-reassign */
      subscription.disabled = true;
      subscription.disableReason = 'GitHubAppUninstalled';
      subscription.installationId = null;
      /* eslint-enable no-param-reassign */
      return subscription.save();
    }));
    await Installation.destroy({ where: { ownerId } }).then((records) => {
      context.log({ ownerId, records }, 'GitHub App uninstalled');
    });
  });
};
