import ErrorMessage from "./error-message";

module.exports = class InstallGitHubApp extends ErrorMessage {
  private githubAppUrl: string;
  constructor(githubAppUrl: string) {
    super();
    this.githubAppUrl = githubAppUrl;
  }

  public toJSON() {
    const message = this.getErrorMessage();
    message.attachments[0].text = "Looks like the app isn't installed on your repository. Install it to proceed.";
    message.attachments[0].actions = [{
      style: "primary",
      text: "Install GitHub App",
      type: "button",
      url: this.githubAppUrl,
    }];
    return message;
  }
};
