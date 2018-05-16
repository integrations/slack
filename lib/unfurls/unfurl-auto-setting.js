// thisChannel and allChannels are actions a user
// can take as part of the unfurl-auto-setting prompt

const AutoUnfurlSettingConfirm = require('../messages/unfurls/auto-unfurl-setting-confirm');

function extractRepo(callbackId) {
  const [repoId, repoNameWithOwner] = callbackId.replace('unfurl-auto-', '').split('|');
  return {
    repoId,
    repoNameWithOwner,
  };
}

async function thisChannel(req, res) {
  const { slackUser, value } = res.locals;
  const { repoId, repoNameWithOwner } = extractRepo(req.body.callback_id);

  await slackUser.setAutomaticUnfurl(repoId, value || req.body.channel.id);
  return res.send({
    replace_original: true,
    attachments: [new AutoUnfurlSettingConfirm(repoNameWithOwner, false).getAttachment()],
  });
}

async function allChannels(req, res) {
  const { slackUser } = res.locals;
  const { repoId, repoNameWithOwner } = extractRepo(req.body.callback_id);

  await slackUser.setAutomaticUnfurl(repoId, 'all');
  return res.send({
    replace_original: true,
    attachments: [new AutoUnfurlSettingConfirm(repoNameWithOwner, true).getAttachment()],
  });
}

module.exports = {
  thisChannel,
  allChannels,
};
