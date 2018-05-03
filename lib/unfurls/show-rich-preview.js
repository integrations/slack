// dismissPrompt and deliverUnfurl are actions a user
// can take as part of the show-rich-preview prompt

const { SlackWorkspace, Unfurl } = require('../models');
const githubUrl = require('../github-url');
const MutePromptsPrompt = require('../messages/unfurls/mute-prompts-prompt');
const AutoUnfurlPrompt = require('../messages/unfurls/auto-unfurl-prompt');

async function dismissPrompt(req, res) {
  const { slackUser } = res.locals;

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

async function deliverUnfurl(req, res) {
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


module.exports = {
  dismissPrompt,
  deliverUnfurl,
};
