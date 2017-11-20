const githubUrl = require('../../github-url');

/**
 * Subscribes a slack channel to activity from an Organization or Repository
 *
 * Usage:
 *   /github subscribe https://github.com/org/repo
 */
module.exports = async (command, { robot, router }) => {
  const match = command.args.match(/^subscribe (.*)$/);

  // Turn the argument into a resource
  const params = githubUrl(match[1]);
  if (params && params.type === 'repo') {
    // FIXME: catch 404
    const installation = await getInstallation(params.owner);

    const github = await robot.auth(installation.id);

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


  /**
   * @param owner - name of a GitHub Organization or User
   */
  async function getInstallation(username) {
    // const github = await robot.auth();
    // const owner = (await github.users.getForUser({ username })).data;
    // return Installation.find(owner.id)

    // FIXME: replace with database lookup
    return { id: 47720 };
  }
};
