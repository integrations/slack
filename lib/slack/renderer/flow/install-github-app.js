const ErrorMessage = require('./error-message');

module.exports = class InstallGitHubApp extends ErrorMessage {
  constructor(githubAppUrl) {
    super({});
    this.githubAppUrl = githubAppUrl;
  }

  toJSON() {
    const message = this.getErrorMessage();
    message.attachments[0].text = 'Looks like the app isn\'t installed on your repository. Install it to proceed.';
    message.attachments[0].actions = [{
      type: 'button',
      text: 'Install GitHub App',
      url: this.githubAppUrl,
      style: 'primary',
    }];
    return message;
  }
};
