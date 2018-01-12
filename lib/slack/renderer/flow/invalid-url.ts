import ErrorMessage from "./error-message";

module.exports = class InvalidUrl extends ErrorMessage {
  private subscribeInput: string;
  constructor(subscribeInput: string) {
    super();
    this.subscribeInput = subscribeInput;
  }

  public toJSON() {
    const message = this.getErrorMessage();
    message.attachments[0].text = `\`${this.subscribeInput}\` does not appear to be a GitHub link.`;
    return message;
  }
};
