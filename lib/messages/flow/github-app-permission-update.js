const ErrorMessage = require('./error-message');

module.exports = class GitHubAppPermissionUpdate extends ErrorMessage {
  constructor({ installation }) {
    super();
    this.installation = installation;
  }
  get guidance() {
    if (this.installation.ownerId === parseInt(this.installation.githubId, 10)) {
      return '';
    }
    return '\n_Note: You will need to ask the owner of the repository or owner of the organization to install it for you. ' +
    'Give them this link._';
  }

  toJSON() {
    const message = this.getErrorMessage();
    message.attachments[0].text = `This feature requires updated permissions.\n${this.guidance}`;
    message.attachments[0].actions = [{
      style: 'primary',
      text: 'Update GitHub App permissions',
      type: 'button',
      url: `${this.installation.html_url}/permissions/update`,
    }];
    return message;
  }
};
