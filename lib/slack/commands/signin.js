const crypto = require('crypto');
const base64url = require('base64-url');

// @todo should also be able to sign out (/github signout)
module.exports = async (command, subscriptionRequest = null) => {
  // generate random state

  // returns slack message with link to click
  // @todo render this message in the renderer

  const state = {
    randomState: crypto.randomBytes(64).toString('base64'),
    teamId: command.team_id,
    userId: command.user_id,
    channelId: command.channel_id,
    responseUrl: command.response_url,
  };
  if (subscriptionRequest) {
    state.subscriptionRequest = subscriptionRequest;
  }

  // security review: Is aes-256-cbc what we should be using here?
  const cipher = crypto.createCipher('aes-256-cbc', process.env.CRYPTO_SECRET);

  let encryptedState = cipher.update(JSON.stringify(state), 'utf8', 'base64');
  encryptedState += cipher.final('base64');
  const escapedEncryptedState = base64url.escape(encryptedState);
  const signupLink =
    `https://${process.env.APP_HOST}/github/oauth/login?state=${escapedEncryptedState}`;
  return {
    response_type: 'ephemeral',
    attachments: [{
      text: `<${signupLink}|Finish connecting your GitHub account>`,
    }],
  };
};
