/**
 * Subscribes a slack channel to activity from an Organization or Repository
 *
 * Usage:
 *   /github subscribe https://github.com/org/repo
 */
module.exports = async (command, { router, resolver }) => {
  const match = command.args.match(/^subscribe (.*)$/);

  // Turn the argument into a resource
  const from = await resolver.resource(match[1]);

  if (from) {
    const to = command.context.channel_id;

    await router.subscribe(from.url, to);

    return {
      response_type: 'in_channel',
      text: `Subscribed <#${to}> to <${from.html_url}|${from.full_name}>`,
    };
  }
  return {
    color: 'danger',
    text: `\`${match[1]}\` does not appear to be a GitHub link.`,
  };
};
