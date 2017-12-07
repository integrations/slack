const GitHub = require('github');

/**
 * Subscribes a slack channel to activity from an Organization or Repository
 *
 * Usage:
 *   /github subscribe https://github.com/org/repo
 */
module.exports = async (req, res) => {
  const { robot, resource, installation, gitHubUser } = res.locals;
  const command = req.body;

  req.log.debug({ installation, resource }, 'Lookup up respository to subscribe');

  // TODO: Steps here to verify this user has access
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
      res.json({
        attachments: [{
          color: 'danger',
          text: `Could not find a repository for \`${req.body.text}\``,
          mrkdwn_in: ['text'],
        }],
      });
      return;
    }
    await robot.models.Subscription.subscribe(from.id, to);

    // @TODO: Move to renderer
    res.json({
      response_type: 'in_channel',
      attachments: [{
        text: `Subscribed <#${to}> to <${from.html_url}|${from.full_name}>`,
      }],
    });
  } else if (command.subcommand === 'unsubscribe') {
    await robot.models.Subscription.unsubscribe(from.id, to);

    // @TODO: Move to renderer
    res.json({
      response_type: 'in_channel',
      attachments: [{
        text: `Unubscribed <#${to}> from <${from.html_url}|${from.full_name}>`,
      }],
    });
  }
};
