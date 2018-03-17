async function handler(req, res) {
  // todo: make it clearer what the flows should be and what initial states are
  const { robot } = res.locals;
  const { Unfurl, SlackWorkspace } = robot.models;
  const { event } = req.body;

  req.log.debug(req.body, 'Slack event received');

  // if there are 3 or more, don't unfurl at all
  if (event.links.length > 2) {
    return res.send();
  }

  let eligibleLinks = await Promise.all(event.links
    .map(async (link) => {
      const eligible = await Unfurl.isEligibleForUnfurl(req.body.team_id, event.channel, link.url);
      if (eligible) {
        req.log.debug(link, 'Link eligible for unfurls');
        return link;
      }
      req.log.debug(link, 'Link not eligible for unfurl');
      return null;
    }));
  eligibleLinks = eligibleLinks.filter(link => link);

  if (eligibleLinks.length === 0) {
    return res.send();
  }

  // if there's 1 link in the message, full unfurl
  // if there are 2 links in the message, condensed unfurl for both
  const type = eligibleLinks.length === 1 ? 'full' : 'condensed';

  const workspace = await SlackWorkspace.findOne({
    where: { slackId: req.body.team_id },
  });

  await Promise.all(eligibleLinks.map(async (link) => {
    // we should try except to here to see if the user doesn't have their account connected.
    // In that case we should chat.ephemeral to prompt them to connect their account
    const newUnfurl = await Unfurl.spawn({
      teamId: req.body.team_id,
      userId: event.user,
      channel: event.channel,
      url: link.url,
      isCondensed: type === 'condensed',
      slackMessageTimestamp: event.message_ts,
    });
    if (!newUnfurl.isDelivered) {
      // Should we staff ship this to only our slack team? possibly

      // we only want to send this message if we're actually able to unfurl this link
      await workspace.client.chat.postEphemeral({
        channel: event.channel,
        user: event.user,
        attachments: [{
          title: `Do you want to show a rich preview for ${link.url}?`,
          text: 'The link you shared is private, so not everyone in this workspace may have access to it.',
          callback_id: `unfurl-${newUnfurl.id}`,
          actions: [
            {
              name: 'unfurl',
              text: 'Show rich preview',
              type: 'button',
              style: 'primary',
            },
            {
              name: 'unfurl-always',
              text: 'Always show a rich preview',
              type: 'button',
              // for this we may need /github settings. So that users can stop always unfurling
            },
          ],
        }],
      });
    }
  }));
  return res.send();

  // if (!userConnectedGitHubAccount) {
  //   await workspace.client.chat.postEphemeral({
  //     text: 'want to see rich previews in Slack? Connect your GitHub account',
  //     channel: event.channel,
  //     user: event.user,
  //   });
  //   return res.send();
  // }
}

module.exports = handler;
