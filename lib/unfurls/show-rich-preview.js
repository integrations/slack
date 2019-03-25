// dismissPrompt and deliverUnfurl are actions a user
// can take as part of the show-rich-preview prompt

const { SlackWorkspace, Unfurl, GitHubUser } = require('../models');
const githubUrl = require('../github-url');
const MutePromptsPrompt = require('../messages/unfurls/mute-prompts-prompt');
const AutoUnfurlPrompt = require('../messages/unfurls/auto-unfurl-prompt');
const UnfurlsDisabledError = require('../messages/unfurls/unfurls-disabled-error');

const PromptSignIn = require('../messages/unfurls/prompt-sign-in');
const SignedParams = require('../signed-params');
const getProtocolAndHost = require('../get-protocol-and-host');

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
  // Check if the user's GitHub account is connected prior to unfurling
  const { slackUser, slackWorkspace } = res.locals;

  await slackUser.reload({ include: [GitHubUser] });
  if (!slackUser.GitHubUser) {
    const state = new SignedParams({
      actionCallbackId: req.body.callback_id,
      teamSlackId: req.body.team.id,
      userSlackId: req.body.user.id,
      channelSlackId: req.body.channel.id,
    });
    const { protocol, host } = getProtocolAndHost(req);
    return res.send({
      delete_original: true,
      attachments: [new PromptSignIn(`${protocol}://${host}/github/oauth/login?state=${await state.stringify()}`).getAttachment()],
    });
  }
  const storedUnfurl = await Unfurl.findById(req.body.callback_id.replace('unfurl-', ''), {
    include: [SlackWorkspace],
  });

  try {
    await storedUnfurl.deliver();
  } catch (err) {
    if (err.name === 'UnfurlsAreDisabled') {
      req.log.debug({
        unfurl_id: storedUnfurl.id,
        team_id: slackWorkspace.slackId,
        user_id: slackUser.slackId,
        channel_id: storedUnfurl.channel,
        url: storedUnfurl.url,
      }, 'Could not deliver unfurl because github.com unfurls are disabled');
      return res.send({
        delete_original: true,
        attachments: [new UnfurlsDisabledError().getAttachment()],
      });
    }
    throw err;
  }

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
