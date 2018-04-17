const { SlackWorkspace, Unfurl } = require('../models');

const PrivateUnfurlPrompt = require('../messages/unfurls/private-unfurl-prompt');
const PromptSignIn = require('../messages/unfurls/prompt-sign-in');
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
      }
    }
  }));
  return res.send();
}

async function unfurlAction(req, res) {
  const storedUnfurl = await Unfurl.findById(req.body.callback_id.replace('unfurl-', ''));

  if (req.body.actions[0].name === 'unfurl-dismiss') {
    if (!storedUnfurl) {
      req.log.warn({
        callback_id: req.body.callback_id,
      }, 'Potential race condition: Unfurl already dismissed.');
    }
    await storedUnfurl.destroy();
    return res.send({
      delete_original: true,
    });
  }

  await storedUnfurl.deliver();

  return res.send({
    delete_original: true,
  });
}

module.exports = {
  linkShared,
  unfurlAction,
};
