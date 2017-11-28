const githubUrl = require('../../github-url');
const GitHub = require('github');
const link = require('./link');

/**
 * Subscribes a slack channel to activity from an Organization or Repository
 *
 * Usage:
 *   /github subscribe https://github.com/org/repo
 */

module.exports = async (command, { robot, router }) => {
  const { SlackUser, User, GitHubUser, SlackWorkspace } = robot.models;
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

  const match = command.text.match(/^subscribe (.*)$/);

  // Check if user exists, if not invoke link
  let gitHubUser;
  try {
    const slackWorkspace = await SlackWorkspace.findOne({
      where: { slackId: command.team_id },
    });
    if (!slackWorkspace) {
      // invoke link
    }
    const slackUser = await SlackUser.findOne({
      where: {
        slackId: command.user_id,
        slackWorkspaceId: slackWorkspace.dataValues.id,
      },
      include: [User],
    });
    gitHubUser = await GitHubUser.findOne({
      where: { userId: slackUser.dataValues.User.dataValues.id },
    });
  } catch (e) {
    robot.log.trace(e, 'User does not exist. Prompt to link');
    // invoke link
    return link(command, command.text);
  }
  // Turn the argument into a resource
  const params = githubUrl(match[1]);
  if (params && params.type === 'repo') {
    // FIXME: catch 404
    const installation = await getInstallation(params.owner);

    robot.log.debug({ installation, params }, 'Lookup up respository to subscribe');

    // TODO: Steps here to verify this user has access
    const userAuthedGithub = new GitHub();
    userAuthedGithub.authenticate({
      type: 'token',
      token: gitHubUser.dataValues.accessToken,
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

    const userHasAccess = from && installationRepos.find(repo => repo.id === from.id);

    if (!userHasAccess) {
      return {
        attachments: [{
          color: 'danger',
          text: `Could not find a repository for \`${match[1]}\``,
          mrkdwn_in: ['text'],
        }],
      };
    }
    await router.subscribe(from.url, to);

    // @TODO: Move to renderer
    return {
      response_type: 'in_channel',
      text: `Subscribed <#${to}> to <${from.html_url}|${from.full_name}>`,
    };
  }
  // @TODO: Move to renderer
  return {
    attachments: [{
      color: 'danger',
      text: `\`${match[1]}\` does not appear to be a GitHub link.`,
      mrkdwn_in: ['text'],
    }],
  };
};
