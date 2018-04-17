const moment = require('moment');

const { SlackWorkspace, Unfurl, SlackUser } = require('../models');
const githubUrl = require('../github-url');

const PrivateUnfurlPrompt = require('../messages/unfurls/private-unfurl-prompt');
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

async function unfurlAction(req, res) {
  if (/unfurl-\d/.test(req.body.callback_id)) {
    const action = req.body.actions[0].name;

    if (action === 'unfurl-dismiss') {
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
    } else if (action === 'unfurl') {
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
  } else if (/unfurl-auto-\d/.test(req.body.callback_id)) {
    const action = req.body.actions[0].name;
    if (action === 'cancel') {
      return res.send({
        delete_original: true,
      });
    }

    const workspace = await SlackWorkspace.findOne({ where: { slackId: req.body.team.id } });
    const [slackUser] = await SlackUser.findOrCreate({
      where: { slackId: req.body.user.id, slackWorkspaceId: workspace.id },
    });
    const [repoId, repoNameWithOwner] = req.body.callback_id.replace('unfurl-auto-', '').split('|');

    if (action === 'this-channel') {
      await slackUser.setAutomaticUnfurl(repoId, req.body.channel.id);
      return res.send({
        replace_original: true,
        attachments: [{
          text: `Links to \`${repoNameWithOwner}\` that you post in this channel will automatically have a rich preview :white_check_mark:`,
        }],
      });
    }
    if (action === 'all-channels') {
      await slackUser.setAutomaticUnfurl(repoId, 'all');
      return res.send({
        replace_original: true,
        attachments: [{
          text: `Links to \`${repoNameWithOwner}\` that you post in any channel of this workspace will automatically have a rich preview :white_check_mark:`,
        }],
      });
    }
  } else if (req.body.callback_id === 'unfurl-mute-prompts') {
    // move these into middleware and attach to locals
    const workspace = await SlackWorkspace.findOne({ where: { slackId: req.body.team.id } });
    const [slackUser] = await SlackUser.findOrCreate({
      where: { slackId: req.body.user.id, slackWorkspaceId: workspace.id },
    });

    const action = req.body.actions[0].name;
    if (action === 'mute-until') {
      await slackUser.update({
        settings: {
          muteUnfurlPromptsUntil: parseInt(req.body.actions[0].value, 10),
        },
      });
      return res.send({
        replace_original: true,
        attachments: [{
          text: `Prompts are muted for ${moment.unix(req.body.actions[0].value).fromNow(true)} :white_check_mark:`,
        }],
      });
    }
    if (action === 'mute-indefinitely') {
      await slackUser.update({
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
  } else {
    throw new Error({
      callback_id: req.body.callback_id,
    }, 'Callback id does not match any patterns');
  }
}

module.exports = {
  linkShared,
  unfurlAction,
};
