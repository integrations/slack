const {
  Message,
} = require('..');

module.exports = class SignInConfirm extends Message {
  constructor(userSlackId, githubProfileUrl, githubLogin) {
    super({});
    this.userSlackId = userSlackId;
    this.githubProfileUrl = githubProfileUrl;
    this.githubLogin = githubLogin;
  }

  getAttachment() {
    return {
      ...super.getBaseMessage(),
      text: `:white_check_mark: Success! <@${this.userSlackId}> is now connected to <${this.githubProfileUrl}|@${this.githubLogin}>`,
      mrkdwn_in: ['text'],
    };
  }
};
