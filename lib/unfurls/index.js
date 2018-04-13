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
          actions: [
            {
              name: 'unfurl-private-repo',
              style: 'primary',
              text: `Enable for ${owner}/${repo}`,
              type: 'button',
              value: storedUnfurl.githubRepoId,
            },
            {
              name: 'unfurl-all-private-links',
              text: 'Enable for all private links',
              type: 'button',
            },
          ],
          callback_id: 'unfurl-update-settings',
          color: '#24292f',
          text: `You can enable automatic rich previews for *${owner}/${repo}*, or for *all* private links that you post in Slack.\nThis settings applies only to *you* in the \`${team.domain}\` workspace.`,
          title: 'Done! Want to automatically show rich previews?',
          mrkdwn_in: [
            'text',
          ],
        }],
      });
    }
  } else if (req.body.callback_id === 'unfurl-update-settings') {
    const workspace = await SlackWorkspace.findOne({ where: { slackId: req.body.team.id } });
    const [slackUser] = await SlackUser.findOrCreate({
      where: { slackId: req.body.user.id, slackWorkspaceId: workspace.id },
    });

    const action = req.body.actions[0].name;
    if (action === 'unfurl-private-repo') {
      const repoId = parseInt(req.body.actions[0].value, 10);
      const { unfurlPrivateRepos } = slackUser.settings;
      if (!unfurlPrivateRepos.includes(repoId)) {
        unfurlPrivateRepos.push(repoId);
      }
      await slackUser.update({
        settings: {
          unfurlPrivateRepos,
        },
      });
      return res.send({
        replace_original: true,
        attachments: [{
          text: 'Links to this repo will automatically have a rich preview :white_check_mark:',
        }],
      });
    } else if (action === 'unfurl-all-private-links') {
      await slackUser.update({
        settings: {
          unfurlAllPrivateLinks: true,
        },
      });
      return res.send({
        replace_original: true,
        attachments: [{
          text: 'All private links posted by you will have a rich preview :white_check_mark:',
        }],
      });
    }
  }
}

module.exports = {
  linkShared,
  unfurlAction,
};
