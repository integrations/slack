const { SlackWorkspace, Unfurl } = require('../models');

async function handler(req, res) {
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

  await Promise.all(eligibleLinks.map(async (link, index) => {
    let newUnfurl;
    try {
      newUnfurl = await Unfurl.spawn({
        teamId: req.body.team_id,
        userId: event.user,
        channel: event.channel,
        url: link.url,
        isCondensed: type === 'condensed',
        slackMessageTimestamp: event.message_ts,
      });
    } catch (err) {
      if (err.name === 'UnsupportedResource') {
        if (index === eligibleLinks.length - 1) {
          // this doesn't really work
          return res.send();
        }
      } else {
        throw err;
      }
    }
    if (process.env.ALLOWED_CHANNELS && process.env.ALLOWED_CHANNELS.split(',').includes(event.channel)) {
      if (newUnfurl && !newUnfurl.isDelivered) {
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
                name: 'unfurl-dismiss',
                text: 'Dismiss',
                type: 'button',
              },
            ],
          }],
        });
      }
    }
  }));
  return res.send();
}

module.exports = handler;
