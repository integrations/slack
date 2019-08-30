const {
  SlackWorkspace, Unfurl,
} = require('../models');

const PrivateUnfurlPrompt = require('../messages/unfurls/private-unfurl-prompt');

const showRichPreview = require('./show-rich-preview');
const unfurlAutoSetting = require('./unfurl-auto-setting');
const mutePrompts = require('./mute-prompts');
const { deliverAfterSignIn } = require('./deliver-after-sign-in');

async function linkShared(req, res) {
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
    let newUnfurl;
    try {
      newUnfurl = await Unfurl.promptOrDeliver({
        teamId: req.body.team_id,
        userId: event.user,
        channel: event.channel,
        url: link.url,
        isCondensed: type === 'condensed',
        slackMessageTimestamp: event.message_ts,
      });
    } catch (err) {
      if (err.name === 'UnsupportedResource' || err.code === 404) {
        req.log.warn(err, 'Could not get unfurl attachment');
        return;
      }
      if (err.name === 'ResourceNotFound') {
        req.log.warn(err, 'Resource not found during unfurl.');
        return;
      }
      if (err.name === 'UnfurlsAreDisabled') {
        req.log.debug({
          team_id: req.body.team_id,
          user_id: event.user,
          channel_id: event.channel,
          url: link.url,
        }, 'Could not unfurl because github.com unfurls are disabled');
        // Failing silently to not annoy users with a message they cannot disable
        return;
      }
      throw err;
    }
    if (newUnfurl && !newUnfurl.isDelivered) {
      if ('is_app_in_channel' in event && event.is_app_in_channel === false) {
        return;
      }
      await workspace.client.chat.postEphemeral({
        channel: event.channel,
        user: event.user,
        attachments: [new PrivateUnfurlPrompt(newUnfurl).getAttachment()],
      });
    }
  }));
  return res.send();
}

function cancel(req, res) {
  return res.send({
    delete_original: true,
  });
}

module.exports = {
  linkShared,
  showRichPreview,
  unfurlAutoSetting,
  mutePrompts,
  cancel,
  deliverAfterSignIn,
};
