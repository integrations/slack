const GitHub = require('github');

const { Subscribed, NotFound } = require('../renderer/flow');

/**
 * Subscribes a slack channel to activity from an Organization or Repository
 *
 * Usage:
 *   /github subscribe https://github.com/org/repo
 */
module.exports = async (req, res) => {
  const { robot, resource, installation, gitHubUser, slackWorkspace } = res.locals;
  const { Subscription } = robot.models;
  const command = req.body;

  req.log.debug({ installation, resource }, 'Lookup up respository to subscribe');

  const userAuthedGithub = new GitHub();
  userAuthedGithub.authenticate({
    type: 'token',
    token: gitHubUser.accessToken,
  });

  const installationAuthedGitHub = await robot.auth(installation.githubId);

  // look up the resource
  let from;
  try {
    from = (await installationAuthedGitHub.repos.get(
      { owner: resource.owner, repo: resource.repo })
    ).data;
  } catch (e) {
    req.log.trace(e, 'couldn\'t find repo');
  }
  const to = command.channel_id;

  if (command.subcommand === 'subscribe') {
    const userHasAccess = from &&
      // Hack to check if user can access the repository
      await userAuthedGithub.pullRequests.getAll(
        { owner: resource.owner, repo: resource.repo, per_page: 1 },
      ).then(() => true).catch(() => false);


    if (!userHasAccess) {
      res.json(new NotFound(req.body.text));
      return;
    }

    await Subscription.subscribe(from.id, to, slackWorkspace.id, installation.id);

    res.json(new Subscribed({
      channelId: to,
      fromRepository: from,
    }));
  } else if (command.subcommand === 'unsubscribe') {
    await Subscription.unsubscribe(from.id, to, slackWorkspace.id);

    res.json(new Subscribed({
      channelId: to,
      fromRepository: from,
      unsubscribed: true,
    }));
  }
};
