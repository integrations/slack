const moment = require('moment');

const { SlackWorkspace, Unfurl } = require('../models');
const githubUrl = require('../github-url');

const PrivateUnfurlPrompt = require('../messages/unfurls/private-unfurl-prompt');
const PromptSignIn = require('../messages/unfurls/prompt-sign-in');
const AutoUnfurlSettingConfirm = require('../messages/unfurls/auto-unfurl-setting-confirm');
const AutoUnfurlPrompt = require('../messages/unfurls/auto-unfurl-prompt');
const MutePromptsPrompt = require('../messages/unfurls/mute-prompts-prompt');
const MutePromptsSettingConfirm = require('../messages/unfurls/mute-prompts-setting-confirm');
const hasEarlyAccess = require('../slack/has-early-access');

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
        return Promise.resolve();
      }
      if (err.name === 'GitHubAccountNotConnected') {
        await workspace.client.chat.postEphemeral({
          channel: event.channel,
          user: event.user,
          attachments: [new PromptSignIn().getAttachment()],
        });
        return Promise.resolve();
      }
      throw err;
    }
    if (hasEarlyAccess({ channelId: event.channel, teamId: req.body.team_id })) {
      if (newUnfurl && !newUnfurl.isDelivered) {
        await workspace.client.chat.postEphemeral({
          channel: event.channel,
          user: event.user,
          attachments: [new PrivateUnfurlPrompt(newUnfurl).getAttachment()],
        });
      } else {
        return Promise.resolve();
      }
    }
  }));
  return res.send();
}

async function showRichPreview(req, res) {
  const { slackUser } = res.locals;
  if (res.locals.action === 'unfurl-dismiss') {
    const storedUnfurl = await Unfurl.findById(req.body.callback_id.replace('unfurl-', ''));
    if (!storedUnfurl) {
      req.log.warn({
        callback_id: req.body.callback_id,
      }, 'Potential race condition: Unfurl already dismissed.');
    }
    await storedUnfurl.destroy();
    if (!await slackUser.shouldPromptToMute()) {
      return res.send({
        delete_original: true,
      });
    }
    return res.send({
      delete_original: true,
      attachments: [new MutePromptsPrompt().getAttachment()],
    });
  }
  if (res.locals.action === 'unfurl') {
    const storedUnfurl = await Unfurl.findById(req.body.callback_id.replace('unfurl-', ''), {
      include: [SlackWorkspace],
    });
    await storedUnfurl.deliver();

    const { owner, repo } = githubUrl(storedUnfurl.url);

    const { team } = await storedUnfurl.SlackWorkspace.client.team.info();

    return res.send({
      delete_original: true,
      attachments: [new AutoUnfurlPrompt(owner, repo, storedUnfurl, team).getAttachment()],
    });
  }
}

async function unfurlAutoSetting(req, res) {
  const [repoId, repoNameWithOwner] = req.body.callback_id.replace('unfurl-auto-', '').split('|');

  if (res.locals.action === 'this-channel') {
    await res.locals.slackUser.setAutomaticUnfurl(repoId, req.body.channel.id);
    return res.send({
      replace_original: true,
      attachments: [new AutoUnfurlSettingConfirm(repoNameWithOwner, false).getAttachment()],
    });
  }
  if (res.locals.action === 'all-channels') {
    await res.locals.slackUser.setAutomaticUnfurl(repoId, 'all');
    return res.send({
      replace_original: true,
      attachments: [new AutoUnfurlSettingConfirm(repoNameWithOwner, true).getAttachment()],
    });
  }
}

async function mutePrompts(req, res) {
  if (res.locals.action === 'mute-24h') {
    await res.locals.slackUser.update({
      settings: {
        muteUnfurlPromptsUntil: moment().add(24, 'hours').unix(),
      },
    });
    return res.send({
      replace_original: true,
      attachments: [new MutePromptsSettingConfirm('for 24h').getAttachment()],
    });
  }
  if (res.locals.action === 'mute-indefinitely') {
    await res.locals.slackUser.update({
      settings: {
        muteUnfurlPromptsIndefinitely: true,
      },
    });
    return res.send({
      replace_original: true,
      attachments: [new MutePromptsSettingConfirm('indefinitely').getAttachment()],
    });
  }
}

module.exports = {
  linkShared,
  showRichPreview,
  unfurlAutoSetting,
  mutePrompts,
};
