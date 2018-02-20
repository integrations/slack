const { InstallGitHubApp, NotFound } = require('../renderer/flow');

/**
 * Get the installation for the given account name
 */
module.exports = async function getInstallation(req, res, next) {
  const {
    robot, resource, gitHubUser, command,
  } = res.locals;
  const { Installation } = robot.models;

  req.log.trace({ resource }, 'Looking up installation');

  const github = await robot.auth();

  let installation;

  try {
    installation = (await github.request({
      method: 'GET',
      url: '/repos/:owner/:repo/installation',
      headers: {
        accept: 'application/vnd.github.machine-man-preview+json',
      },
      owner: resource.owner,
      repo: resource.repo,
    })).data;

    res.locals.installation = await Installation.findOne({ where: { githubId: installation.id } });
    next();
  } catch (e) {
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
      return res.json(new NotFound(command.args[0]));
    }
  }
};
