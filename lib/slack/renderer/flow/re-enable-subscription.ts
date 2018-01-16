import { Message } from "../";

module.exports = class ReEnableSubscription extends Message {
  private repoName: string;
  private creator: string;
  constructor(repoName: string, creator: string) {
    super({});
    this.repoName = repoName;
    this.creator = creator;
  }

  public getAttachment() {
    return {
      ...this.getBaseMessage(),
      text: `The subscription to ${this.repoName} has been disabled, ` +
      `because the subscription creator (<@${this.creator}>) no longer has access` +
      `Run \`/github subscribe ${this.repoName}\` to re-enable the subscription`,
    };
  }

  public toJSON() {
    return {
      attachments: [this.getAttachment()],
      response_type: "in_channel",
    };
  }
};
