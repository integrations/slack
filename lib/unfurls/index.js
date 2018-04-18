const moment = require('moment');

const { SlackWorkspace, Unfurl } = require('../models');
const githubUrl = require('../github-url');

const PrivateUnfurlPrompt = require('../messages/unfurls/private-unfurl-prompt');
const PromptSignIn = require('../messages/unfurls/prompt-sign-in');
const AutoUnfurlSettingConfirm = require('../messages/unfurls/auto-unfurl-setting-confirm');
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
  if (res.locals.action === 'unfurl-dismiss') {
    const storedUnfurl = await Unfurl.findById(req.body.callback_id.replace('unfurl-', ''));
    if (!storedUnfurl) {
      req.log.warn({
        callback_id: req.body.callback_id,
      }, 'Potential race condition: Unfurl already dismissed.');
    }
    await storedUnfurl.destroy();
    return res.send({
      delete_original: true,
      attachments: [{
        callback_id: 'unfurl-mute-prompts',
        title: 'Getting too many prompts?',
        color: '#24292f',
        actions: [
          {
            name: 'mute-until',
            text: 'Mute prompts for 24h',
            value: moment().add(24, 'hours').unix(),
            type: 'button',
          },
          {
            name: 'mute-indefinitely',
            text: 'Mute prompts indefinitely',
            type: 'button',
          },
          {
            name: 'cancel',
            text: 'Cancel',
            type: 'button',
          },
        ],
      }],
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
      attachments: [{
        callback_id: `unfurl-auto-${storedUnfurl.githubRepoId}|${owner}/${repo}`,
        color: '#24292f',
        text: `You can enable automatic previews for links to ${owner}/${repo} that *you* post either to this channel or to all channels in the \`${team.domain}\` workspace.`,
        title: `Done! Want to automatically show rich previews for ${owner}/${repo}?`,
        actions: [
          {
            name: 'this-channel',
            style: 'primary',
            text: 'Enable for this channel',
            type: 'button',
          },
          {
            name: 'all-channels',
            text: 'Enable for all channels',
            type: 'button',
          },
          {
            name: 'cancel',
            text: 'Cancel',
            type: 'button',
          },
        ],
        mrkdwn_in: [
          'text',
        ],
      }],
    });
  }
}

async function unfurlAutoSetting(req, res) {
  if (res.locals.action === 'cancel') {
    return res.send({
      delete_original: true,
    });
  }

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
  if (res.locals.action === 'mute-until') {
    await res.locals.slackUser.update({
      settings: {
        muteUnfurlPromptsUntil: parseInt(res.locals.value, 10),
      },
    });
    return res.send({
      replace_original: true,
      attachments: [{
        text: `Prompts are muted for ${moment.unix(res.locals.value).fromNow(true)} :white_check_mark:`,
      }],
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
      attachments: [{
        text: 'Prompts are muted indefinitely :white_check_mark:\nYou can adjust this setting by invoking `/github settings`',
        mrkdwn_in: ['text'],
      }],
    });
  }
}

module.exports = {
  linkShared,
  showRichPreview,
  unfurlAutoSetting,
  mutePrompts,
};
