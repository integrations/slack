import { getChannelString, Message  } from "../";

interface IRepository {
  html_url: string;
  full_name: string;
}

interface IOutput {
  attachments: [{
    [index: string]: string;
  }];
  response_type: string;
}

module.exports = class SubscriptionList extends Message {
  private repositories: IRepository[];
  private channel: string;
  constructor(repositories: IRepository[], channelId: string) {
    super({});
    this.repositories = repositories;
    this.channel = getChannelString(channelId);
  }

  public toJSON() {
    let prefix;
    if (this.channel) {
      prefix = `${this.channel}is subscribed to`;
    } else {
      prefix = "Subscribed to";
    }
    const output: IOutput = {
      attachments: [{
        ...this.getBaseMessage(),
        fallback: `${prefix} ${this.repositories.length} repositor${this.repositories.length === 1 ? "y" : "ies"}`,
      }],
      response_type: "in_channel",
    };
    if (this.repositories.length > 0) {
      output.attachments[0].title = prefix;
      output.attachments[0].text = this.repositoriesToString().join("\n");
      return output;
    }
    output.attachments[0].text = output.attachments[0].fallback;
    return output;
  }

  private repositoriesToString() {
    return this.repositories.map((repository: IRepository) => (
      `<${repository.html_url}|${repository.full_name}>`
    ));
  }
};
