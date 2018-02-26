const ErrorMessage = require('./error-message');

module.exports = class InstallGitHubApp extends ErrorMessage {
  constructor(githubAppUrl) {
    super();
    this.githubAppUrl = githubAppUrl;
  }

  toJSON() {
    const message = this.getErrorMessage();
    message.attachments[0].text = 'Either the app isn\'t installed on your repository' +
    ' or the repository does not exist. Install it to proceed.';
    message.attachments[0].actions = [{
      style: 'primary',
      text: 'Install GitHub App',
      type: 'button',
      url: this.githubAppUrl,
    }];
    return message;
  }
};
