import ErrorMessage from "./error-message";

module.exports = class AlreadySubscribed extends ErrorMessage {
  private subscribeInput: string;
  constructor(subscribeInput: string) {
    super();
    this.subscribeInput = subscribeInput;
  }

  public toJSON() {
    const message = this.getErrorMessage();
    message.attachments[0].text = `You're already subscribed to \`${this.subscribeInput}\``;
    return message;
  }
};
