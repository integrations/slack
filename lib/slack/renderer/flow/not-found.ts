import ErrorMessage from "./error-message";

module.exports = class NotFound extends ErrorMessage {
  private subscribeInput: string;
  constructor(subscribeInput: string) {
    super();
    this.subscribeInput = subscribeInput;
  }

  public toJSON() {
    const message = this.getErrorMessage();
    message.attachments[0].text = `Could not find resource: \`${this.subscribeInput}\``;
    return message;
  }
};
