const ErrorMessage = require('./error-message');

module.exports = class GitHubAppPermissionUpdate extends ErrorMessage {
  constructor({ installation }) {
    super();
    this.installation = installation;
  }
  get guidance() {
    if (this.owner.id === parseInt(this.gitHubUser.id, 10)) {
      return '';
    }
    if (this.owner.type === 'User') {
      return '\n_Note: You will need to ask the owner of the repository to install it for you. ' +
      `Give them <${this.installLink}|this link.>_`;
    }
    return '\n_Note: You need to be an organization owner to install the app (or ask one to install it for you)._';
  }

  toJSON() {
    const message = this.getErrorMessage();
    message.attachments[0].text = 'This feature requires updated permissions.';
    message.attachments[0].actions = [{
      style: 'primary',
      text: 'Update GitHub App permissions',
      type: 'button',
      url: `${this.installation.html_url}/permissions/update`,
    }];
    return message;
  }
};
