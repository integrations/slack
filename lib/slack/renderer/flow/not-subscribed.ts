import ErrorMessage from "./error-message";

module.exports = class NotSubscribed extends ErrorMessage {
  private subscribeInput: string;
  constructor(subscribeInput: string) {
    super();
    this.subscribeInput = subscribeInput;
  }

  public toJSON() {
    const message = this.getErrorMessage();
    message.attachments[0].text = `You're not currently subscribed to ` +
      `\`${this.subscribeInput}\`\nUse \`/github subscribe ${this.subscribeInput}\` to subscribe.`;
    return message;
  }
};
