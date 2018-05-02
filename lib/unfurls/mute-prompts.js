// mute24h and muteIndefinitely are actions a user
// can take as part of the mute-prompts prompt
const MutePromptsSettingConfirm = require('../messages/unfurls/mute-prompts-setting-confirm');

async function mute24h(req, res) {
  await res.locals.slackUser.muteUnfurlPromptsFor24h();
  return res.send({
    replace_original: true,
    attachments: [new MutePromptsSettingConfirm('for 24h').getAttachment()],
  });
}

async function muteIndefinitely(req, res) {
  await res.locals.slackUser.muteUnfurlPromptsIndefinitely();
  return res.send({
    replace_original: true,
    attachments: [new MutePromptsSettingConfirm('indefinitely').getAttachment()],
  });
}

module.exports = {
  mute24h,
  muteIndefinitely,
};
