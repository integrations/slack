const { InstallGitHubApp, NotFound } = require('../renderer/flow');

/**
 * Get the installation for the given account name
 */
module.exports = async function getInstallation(req, res, next) {
  const {
    robot, resource, gitHubUser, command,
  } = res.locals;
  const { Installation } = robot.models;

  req.log.debug({ resource }, 'Looking up installation');

  try {
    const installation = await Installation.sync(await robot.auth(), resource);
    req.log.debug({ resource, installation }, 'Found installation');
    res.locals.installation = installation;

    return next();
  } catch (err) {
    if (err.code !== 404) {
      throw err;
    }
  }

  req.log.debug({ resource }, 'Could not find installation');

  // Use user access token to resolve owner name to id
  try {
    const owner = (await gitHubUser.client.users.getForUser({ username: resource.owner })).data;
    const info = await robot.info();
    const url = `${info.html_url}/installations/new/permissions?target_id=${owner.id}`;
    if (/api\.slack\.com/.test(req.headers['user-agent'])) {
      res.json(new InstallGitHubApp(url));
    } else {
      res.redirect(url);
    }
  } catch (err) {
    res.json(new NotFound(command.args[0]));
  }
};
