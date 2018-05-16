const { SlackWorkspace, Unfurl } = require('../models');

const PrivateUnfurlPrompt = require('../messages/unfurls/private-unfurl-prompt');
const PromptSignIn = require('../messages/unfurls/prompt-sign-in');
const PromptToInviteApp = require('../messages/unfurls/prompt-to-invite-app');
const hasEarlyAccess = require('../slack/has-early-access');
const SignedParams = require('../signed-params');
const getProtocolAndHost = require('../get-protocol-and-host');

const showRichPreview = require('./show-rich-preview');
const unfurlAutoSetting = require('./unfurl-auto-setting');
const mutePrompts = require('./mute-prompts');

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
        req.log.debug(err, 'Could not get unfurl attachment');
        return;
      }
      if (err.name === 'GitHubAccountNotConnected') {
        const state = new SignedParams({ slackEvent: { ...req.body, token: undefined } });
        const { protocol, host } = getProtocolAndHost(req);
        await workspace.client.chat.postEphemeral({
          channel: event.channel,
          user: event.user,
          attachments: [new PromptSignIn(`${protocol}://${host}/github/oauth/login?state=${await state.stringify()}`).getAttachment()],
        });
        return;
      }
      throw err;
    }
    if (hasEarlyAccess({ channelId: event.channel, teamId: req.body.team_id })) {
      if (newUnfurl && !newUnfurl.isDelivered) {
        try {
          await workspace.client.chat.postEphemeral({
            channel: event.channel,
            user: event.user,
            attachments: [new PrivateUnfurlPrompt(newUnfurl).getAttachment()],
          });
        } catch (err) {
          if (err.data && err.data.error === 'channel_not_found') {
            req.log.debug({
              user: event.user,
              channel: event.channel,
              workspace: workspace.slackId,
            }, 'Could not send ephemeral unfurl prompt in channel. Re-trying in direct message');
            await workspace.client.chat.postEphemeral({
              channel: event.user,
              user: event.user,
              attachments: [new PrivateUnfurlPrompt(newUnfurl).getAttachment()],
            });

            await workspace.client.chat.postEphemeral({
              channel: event.user,
              user: event.user,
              attachments: [new PromptToInviteApp(event.channel).getAttachment()],
            });
          } else {
            throw err;
          }
        }
      }
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
};
