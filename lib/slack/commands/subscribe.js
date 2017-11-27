const githubUrl = require('../../github-url');
const GitHub = require('github');

/**
 * Subscribes a slack channel to activity from an Organization or Repository
 *
 * Usage:
 *   /github subscribe https://github.com/org/repo
 */

// @todo should take optional useResponseUrl, and then it doesn't return, but instead posts to the responseUrl
module.exports = async (command, { robot, router }) => {
  /**
   * Get the installation for the given account name
   *
   * @param username - name of a GitHub Organization or User
   */
  async function getInstallation(username) {
    const { Installation } = robot.models;
    // FIXME: need an anuthenticated client, but authetnicating as app doesn't work
    // const github = await robot.auth();
    const github = new GitHub();
    robot.log.trace({ username }, 'Looking up installation');

    let owner;

    // TODO: open friction issue about being able to do this with one API call
    try {
      owner = (await github.orgs.get({ org: username })).data;
    } catch (err) {
      owner = (await github.users.getForUser({ username })).data;
    }

    return Installation.getForOwner(owner.id);
  }

  const match = command.args.match(/^subscribe (.*)$/);

  // Turn the argument into a resource
  const params = githubUrl(match[1]);
  if (params && params.type === 'repo') {
    // FIXME: catch 404
    const installation = await getInstallation(params.owner);

    robot.log.debug({ installation, params }, 'Lookup up respository to subscribe');

    const github = await robot.auth(installation.githubId);

    // TODO: Steps here to verify this user has access

    // look up the resource
    const from = (await github.repos.get({ owner: params.owner, repo: params.repo })).data;
    const to = command.context.channel_id;

    await router.subscribe(from.url, to);

    // @TODO: Move to renderer
    return {
      response_type: 'in_channel',
      text: `Subscribed <#${to}> to <${from.html_url}|${from.full_name}>`,
    };
  }
  // @TODO: Move to renderer
  return {
    color: 'danger',
    text: `\`${match[1]}\` does not appear to be a GitHub link.`,
    mrkdwn_in: ['text'],
  };
};
