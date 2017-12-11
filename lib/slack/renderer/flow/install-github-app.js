const { ErrorMessage } = require('./error-message');

class InstallGitHubApp extends ErrorMessage {
  constructor({ githubAppUrl }) {
    super({});
    this.githubAppUrl = githubAppUrl;
  }

  toJSON() {
    const message = this.getErrorMessage();
    message.attachments[0].text = `Looks like the app isn't installed on your repository. <${this.githubAppUrl}|Install the GitHub App> to proceed.`;
    return message;
  }
}

module.exports = {
  InstallGitHubApp,
};
