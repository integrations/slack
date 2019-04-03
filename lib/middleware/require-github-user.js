const axios = require('axios');

const SignedParams = require('../signed-params');
const getProtocolAndHost = require('../get-protocol-and-host');
const { SignIn } = require('../messages/flow');
const githubSignInAttempt = require('../github-sign-in-attempt');

/**
 * Require the user to have connected their GitHub account
 */
module.exports = async function requireGitHubUser(req, res, next) {
  const { slackUser } = res.locals;

  if (!slackUser.GitHubUser) {
    const state = new SignedParams({
      actionCallbackId: req.body.callback_id,
      teamSlackId: req.body.team.id,
      teamSlackDomain: req.body.team.domain,
      userSlackId: req.body.user.id,
      channelSlackId: req.body.channel.id,
    });
    const { protocol, host } = getProtocolAndHost(req);
    const message = new SignIn(`${protocol}://${host}/github/oauth/login?state=${await state.stringify()}`);

    await githubSignInAttempt.initiate(req.body.team.id, req.body.user.id);

    const { response_url } = req.body;
    if (response_url) {
      res.send();
      return axios.post(response_url, message.toJSON());
    }
    return res.json(message);
  }

  next();
};
