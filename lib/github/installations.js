/**
 * Track GitHub App installations
 *
 *
 */
module.exports = robot => {
  const { Installation } = robot.models;

  robot.on('installation.created', async (context) => {
    await Installation
      .findOrCreate({
        where: { ownerId: context.payload.installation.account.id },
        defaults: { githubId: context.payload.installation.id },
      })
      .spread((installation, created) => {
        robot.log(installation.get({ plain: true }));
        robot.log(created);
      });
  });

  robot.on('installation.deleted', async (context) => {
    const { Installation } = robot.models;

    await Installation
      .destroy({
        where: { ownerId: context.payload.installation.account.id },
      });
  });
};
