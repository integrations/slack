const githubUrl = require('../../github-url');
const GitHub = require('github');
const signin = require('./signin');

/**
 * Subscribes a slack channel to activity from an Organization or Repository
 *
 * Usage:
 *   /github subscribe https://github.com/org/repo
 */
module.exports = async (req, res) => {
  const command = req.body;
  const robot = res.locals.robot;
  const { SlackUser, User, GitHubUser } = robot.models;

  /**
   * Get the installation for the given account name
   *
   * @param username - name of a GitHub Organization or User
   */
  async function getInstallation(username) {
    const { Installation } = robot.models;
    const unauthedGitHub = new GitHub();
    // FIXME: need an anuthenticated client, but authetnicating as app doesn't work
    // const github = await robot.auth();
    req.log.trace({ username }, 'Looking up installation');

    let owner;

    // TODO: open friction issue about being able to do this with one API call
    try {
      owner = (await unauthedGitHub.orgs.get({ org: username })).data;
    } catch (err) {
      owner = (await unauthedGitHub.users.getForUser({ username })).data;
    }

    return Installation.getForOwner(owner.id);
  }

  const url = command.text;

  // Check if user exists, if not invoke signin
  let gitHubUser;
  try {
    const slackUser = await SlackUser.findOne({
      where: {
        slackId: command.user_id,
      },
      include: [User],
    });
    gitHubUser = await GitHubUser.findOne({
      where: { userId: slackUser.User.id },
    });
  } catch (e) {
    robot.log.trace(e, 'User does not exist. Prompt to signin');
    // invoke signin
    signin(req, res);
    return;
  }

  // Turn the argument into a resource
  const params = githubUrl(url);

  if (params && params.type === 'repo') {
    // FIXME: catch 404
    const installation = await getInstallation(params.owner);

    if (!installation) {
      const info = await robot.info();

      res.json({
        attachments: [{
          text: `<${info.html_url}|Install the GitHub App>`,
        }],
      });
      return;
    }

    req.log.debug({ installation, params }, 'Lookup up respository to subscribe');

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
        { owner: params.owner, repo: params.repo })
      ).data;
    } catch (e) {
      req.log.trace(e, 'couldn\'t find repo');
    }
    const to = command.channel_id;

    if (command.subcommand === 'subscribe') {
      const userHasAccess = from &&
        // Hack to check if user can access the repository
        await userAuthedGithub.pullRequests.getAll(
          { owner: params.owner, repo: params.repo, per_page: 1 },
        ).then(() => true).catch(() => false);


      if (!userHasAccess) {
        res.json({
          attachments: [{
            color: 'danger',
            text: `Could not find a repository for \`${url}\``,
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
      return;
    } else if (command.subcommand === 'unsubscribe') {
      await robot.models.Subscription.unsubscribe(from.id, to);

      // @TODO: Move to renderer
      res.json({
        response_type: 'in_channel',
        attachments: [{
          text: `Unubscribed <#${to}> from <${from.html_url}|${from.full_name}>`,
        }],
      });
      return;
    }
  }
  // @TODO: Move to renderer
  res.json({
    attachments: [{
      color: 'danger',
      text: `\`${url}\` does not appear to be a GitHub link.`,
      mrkdwn_in: ['text'],
    }],
  });
};
