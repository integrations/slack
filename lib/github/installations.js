/**
 * Track GitHub App installations
 *
 *
 */
module.exports = (robot) => {
  const { Installation } = robot.models;

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
    await Installation.destroy({ where: { ownerId } }).then((records) => {
      context.log({ ownerId, records }, 'GitHub App uninstalled');
    });
  });
};
