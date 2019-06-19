const { GitHubAppPermissionUpdate } = require('../messages/flow');
const { Installation } = require('../models');
const logger = require('../logger');

module.exports = (originalFunction, permissions) => async (req, res, next) => {
  // Check for permission update needed ONLY if this fails
  try {
    await originalFunction(req, res, next);
  } catch (err) {
    logger.debug({ err });
    if (err.code === 403 || err.code === 404) {
      const { command, installation, robot, resource } = res.locals;
      const { owner, repo } = resource;
      const hasPermissions = await Installation.assertPermissions(await robot.auth(), {
        owner,
        repo,
        permissions,
      });

      if (!hasPermissions) {
        return command.respond(new GitHubAppPermissionUpdate({ installation }));
      }

      next();
    }
  }
};
