const { Installation } = require('../models');
const { InstallGitHubApp, NotFound } = require('../messages/flow');
const SignedParams = require('../signed-params');
const isRequestFromSlack = require('../is-request-from-slack');
const getProtocolAndHost = require('../get-protocol-and-host');

/**
 * Get the installation for the given account name
 */
module.exports = async function getInstallation(req, res, next) {
  const {
    robot, resource, gitHubUser, command,
  } = res.locals;

  req.log.debug({ resource }, 'Looking up installation');

  try {
    const installation = await Installation.sync({
      app: await robot.auth(),
      user: gitHubUser.client,
    }, resource);

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

    const state = new SignedParams({
      trigger_id: command.trigger_id,
    });

    const { protocol, host } = getProtocolAndHost(req);

    const installLink = `${protocol}://${host}/github/install/${owner.id}/${await state.stringify()}`;

    if (isRequestFromSlack(req)) {
      return command.respond(new InstallGitHubApp({ installLink, owner, gitHubUser }));
    }
    return res.redirect(installLink);
  } catch (err) {
    return command.respond(new NotFound(command.args[0]));
  }
};
