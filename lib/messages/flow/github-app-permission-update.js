const ErrorMessage = require('./error-message');

module.exports = class GitHubAppPermissionUpdate extends ErrorMessage {
  constructor({ installation }) {
    super();
    this.installation = installation;
  }
  get guidance() {
    return '\n_Note: If you are not the owner of the repository or the owner of the organization, ' +
      'you will have to ask the owner to install it for you. ' +
    `Give them this link: ${this.installation.html_url}/permissions/update _`;
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
