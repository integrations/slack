const moment = require('moment');

const { SlackUser, SlackWorkspace, GitHubUser } = require('../models');

/**
 * Lets users adjust their individual settings
 *
 * Usage:
 *   /github settings
 */
async function settings(req, res) {
  const { command } = res.locals;

  const slackWorkspace = await SlackWorkspace.findOne({ where: { slackId: req.body.team_id } });
  const slackUser = await SlackUser.findOne({
    where: { slackId: req.body.user_id, slackWorkspaceId: slackWorkspace.id },
    include: [GitHubUser],
  });

  if (!slackUser) {
    return command.respond({ text: 'You do not have any settings configured.' });
  }

  const {
    unfurlPrivateResources,
    muteUnfurlPromptsUntil,
    muteUnfurlPromptsIndefinitely,
  } = slackUser.settings;

  const attachments = [];
  if (Object.keys(unfurlPrivateResources).length !== 0) {
    const repositoryIds = Object.keys(unfurlPrivateResources);

    let repositories = await Promise.all(repositoryIds.map(async (repoId) => {
      try {
        const repository = await slackUser.GitHubUser.client.repos.getById({ id: repoId });
        return repository.data;
      } catch (err) {
        req.log.error({ err, repoId }, 'Could not find repository for subscription');
        if (err.code !== 404) {
          throw err;
        }
      }
    }));

    // remove undefined
    repositories = repositories.filter(repo => repo);

    attachments.push({
      title: 'Automatic rich previews',
      text: `Links you post linking to ${repositories.length} private repositor${repositories.length === 1 ? 'y' : 'ies'} automatically get a rich preview. Select a repository to adjust its settings.`,
      callback_id: 'unfurl-auto-get-settings-for-repo',
      actions: [{
        name: 'repo-list',
        text: 'Select a repository',
        type: 'select',
        options: repositories.map(repository => ({
          text: repository.full_name,
          value: `${repository.id}|${repository.full_name}`,
        })),
      }],
    });
  }
  if (muteUnfurlPromptsUntil || muteUnfurlPromptsIndefinitely) {
    attachments.push({
      title: 'Muted prompts to show rich preview',
      text: `Prompts to show a rich preview are muted ${muteUnfurlPromptsIndefinitely ? 'indefinitely' : `for ${moment.unix(muteUnfurlPromptsUntil).toNow(true)}`}`,
      callback_id: 'unfurl-prompts-unmute',
      actions: [{
        name: 'unmute',
        text: 'Unmute',
        type: 'button',
      }],
    });
  }

  if (attachments.length === 0) {
    attachments.push({ text: 'You do not have any settings configured.' });
  }
  return command.respond({ attachments });
}

async function unfurlAutoGetSettingsByRepo(req, res) {
  const { slackUser } = res.locals;
  const [repoId, repoNameWithOwner] = req.body.actions[0].selected_options[0].value.split('|');

  const channels = slackUser.settings.unfurlPrivateResources[repoId];

  const channelText = channels.includes('all') ? 'all channels.' : `the following channels:${channels.map(channel => `\n<#${channel}>`)}`;
  return res.send({
    replace_original: true,
    attachments: [{
      title: 'Automatic rich previews',
      text: `Links you post linking to \`${repoNameWithOwner}\` automatically get a rich preview in ${channelText}`,
      callback_id: 'unfurl-auto-settings-remove-repo',
      actions: [{
        name: 'remove-repo',
        type: 'button',
        style: 'danger',
        text: 'Disable automatic rich previews',
        value: `${repoId}|${repoNameWithOwner}`,
        confirm: {
          title: 'Are you sure?',
          text: `This will disable automatic rich previews for links you post linking to \`${repoNameWithOwner}\` in *all* channels`,
          ok_text: 'Yes',
          dismiss_text: 'Cancel',
        },
      }],
    }],
  });
}

async function unfurlAutoSettingsRemoveRepo(req, res) {
  const { value, slackUser } = res.locals;
  const [repoId, repoNameWithOwner] = value.split('|');

  await slackUser.removeAutomaticUnfurl(repoId);

  return res.send({ text: `:white_check_mark: Links you post to \`${repoNameWithOwner}\` will no longer receive automatic rich previews.` });
}

async function unfurlPromptsUnmute(req, res) {
  const { slackUser } = res.locals;

  await slackUser.removeUnfurlPromptsMute();

  return res.send({ text: ':white_check_mark: Prompts to show a rich preview have been unmuted' });
}
module.exports = {
  settings,
  unfurlAutoGetSettingsByRepo,
  unfurlAutoSettingsRemoveRepo,
  unfurlPromptsUnmute,
};
