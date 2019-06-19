const { GitHubAppPermissionUpdate } = require('../messages/flow');
const { Installation } = require('../models');

module.exports = permissions => async (req, res, next) => {
  const { command, installation, robot, resource } = res.locals;
  const { owner, repo } = resource;
  const hasPermissions = await Installation.assertPermissions(await robot.auth(), { owner, repo, permissions });

  if (!hasPermissions) {
    return command.respond(new GitHubAppPermissionUpdate({ installation }));
  }

  next();
};
