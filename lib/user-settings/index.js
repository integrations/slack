const {
  CombinedSettings,
  UnfurlAutoSettingsForRepo,
  UnfurlAutoSettingsRemoveConfirm,
  UnfurlSettingsUnmuteConfirm,
} = require('../messages/user-settings');

/**
 * Lets users adjust their individual settings
 *
 * Usage:
 *   /github settings
 */
async function settings(req, res) {
  const { command, slackUser } = res.locals;

  const {
    unfurlPrivateResources,
    muteUnfurlPromptsUntil,
    muteUnfurlPromptsIndefinitely,
  } = slackUser.settings;

  let autoUnfurlRepos;
  if (Object.keys(unfurlPrivateResources).length !== 0) {
    const repositoryIds = Object.keys(unfurlPrivateResources);

    const repositories = await Promise.all(repositoryIds.map(async (repoId) => {
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
    autoUnfurlRepos = repositories.filter(repo => repo);
  }

  const attachments = new CombinedSettings({
    muteUnfurlPromptsUntil,
    muteUnfurlPromptsIndefinitely,
    autoUnfurlRepos,
  }).getAttachments();
  return command.respond({ attachments });
}


async function unfurlAutoGetSettingsByRepo(req, res) {
  const { slackUser } = res.locals;
  const actionValue = req.body.actions[0].selected_options[0].value;

  return res.send({
    replace_original: true,
    attachments: [new UnfurlAutoSettingsForRepo(actionValue, slackUser).getAttachment()],
  });
}

async function unfurlAutoSettingsRemoveRepo(req, res) {
  const { value, slackUser } = res.locals;
  const [repoId, repoNameWithOwner] = value.split('|');

  await slackUser.removeAutomaticUnfurl(repoId);

  return res.send({
    attachments: [new UnfurlAutoSettingsRemoveConfirm(repoNameWithOwner).getAttachment()],
  });
}

async function unfurlPromptsUnmute(req, res) {
  const { slackUser } = res.locals;

  await slackUser.removeUnfurlPromptsMute();

  return res.send({
    attachments: [new UnfurlSettingsUnmuteConfirm().getAttachment()],
  });
}
module.exports = {
  settings,
  unfurlAutoGetSettingsByRepo,
  unfurlAutoSettingsRemoveRepo,
  unfurlPromptsUnmute,
};
