const ErrorMessage = require('./error-message');

module.exports = class InstallGitHubApp extends ErrorMessage {
  constructor({ installLink, ownerType }) {
    super();
    this.installLink = installLink;
    this.ownerType = ownerType;
  }
  get guidance() {
    if (!this.ownerType) {
      return '\n';
    }
    if (this.ownerType === 'User') {
      return '\n_Note: You need to be the owner of the repository to install the app (or ask them to install it for you)._';
    }
    return '\n_Note: You need to be an organization owner to install the app (or ask one to install it for you)._';
  }

  toJSON() {
    const message = this.getErrorMessage();
    message.attachments[0].text = 'Either the app isn\'t installed on your repository' +
    ` or the repository does not exist. Install it to proceed.${this.guidance}`;
    message.attachments[0].actions = [{
      style: 'primary',
      text: 'Install GitHub App',
      type: 'button',
      url: this.installLink,
    }];
    return message;
  }
};
