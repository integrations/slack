const githubUrl = require('../../github-url');
const GitHub = require('github');
const signin = require('./signin');

/**
 * Subscribes a slack channel to activity from an Organization or Repository
 *
 * Usage:
 *   /github subscribe https://github.com/org/repo
 */
module.exports = async (command, { robot }) => {
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
    robot.log.trace({ username }, 'Looking up installation');

    let owner;

    // TODO: open friction issue about being able to do this with one API call
    try {
      owner = (await unauthedGitHub.orgs.get({ org: username })).data;
    } catch (err) {
      owner = (await unauthedGitHub.users.getForUser({ username })).data;
    }

    return Installation.getForOwner(owner.id);
  }

  const [, subcommand, url] = command.text.match(/^((?:un)?subscribe) (.*)$/);

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
    return signin(command, command.text);
  }
  // Turn the argument into a resource
  const params = githubUrl(url);

  if (params && params.type === 'repo') {
    // FIXME: catch 404
    const installation = await getInstallation(params.owner);

    if (!installation) {
      const info = await robot.info();

      return {
        attachments: [{
          text: `<${info.html_url}|Install the GitHub App>`,
        }],
      };
    }

    robot.log.debug({ installation, params }, 'Lookup up respository to subscribe');

    // TODO: Steps here to verify this user has access
    const userAuthedGithub = new GitHub();
    userAuthedGithub.authenticate({
      type: 'token',
      token: gitHubUser.accessToken,
    });

    const installationRepos = (await userAuthedGithub.users.getInstallationRepos({
      installation_id: installation.githubId,
      headers: {
        accept: 'application/vnd.github.machine-man-preview+json',
      },
    })).data.repositories;

    const installationAuthedGitHub = await robot.auth(installation.githubId);

    // look up the resource
    let from;
    try {
      from = (await installationAuthedGitHub.repos.get(
        { owner: params.owner, repo: params.repo })
      ).data;
    } catch (e) {
      robot.log.trace(e, 'couldn\'t find repo');
    }
    const to = command.channel_id;

    if (subcommand === 'subscribe') {
      const userHasAccess = from && installationRepos.find(repo => repo.id === from.id);

      if (!userHasAccess) {
        return {
          attachments: [{
            color: 'danger',
            text: `Could not find a repository for \`${url}\``,
            mrkdwn_in: ['text'],
          }],
        };
      }
      await robot.models.Subscription.subscribe(from.id, to);

      // @TODO: Move to renderer
      return {
        response_type: 'in_channel',
        attachments: [{
          text: `Subscribed <#${to}> to <${from.html_url}|${from.full_name}>`,
        }],
      };
    } else if (subcommand === 'unsubscribe') {
      await robot.models.Subscription.unsubscribe(from.id, to);

      // @TODO: Move to renderer
      return {
        response_type: 'in_channel',
        attachments: [{
          text: `Unubscribed <#${to}> from <${from.html_url}|${from.full_name}>`,
        }],
      };
    }
  }
  // @TODO: Move to renderer
  return {
    attachments: [{
      color: 'danger',
      text: `\`${url}\` does not appear to be a GitHub link.`,
      mrkdwn_in: ['text'],
    }],
  };
};
