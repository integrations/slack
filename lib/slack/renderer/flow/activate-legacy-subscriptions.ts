import { Message } from "../";

interface ILegacySubscription {
  authorSlackId: string;
  repoFullName: string;
}

interface IGroupedSubscription {
  [index: string]: ILegacySubscription[];
}

interface IField {
  value: string;
}

interface IAttachment {
  pretext?: string;
  fields?: IField[];
  text?: string;
  mrkdwn_in?: string[];
}

interface IAttachmentWithFields extends IAttachment {
  fields: IField[];
}

module.exports = class ActivateLegacySubscriptions extends Message {
  private subscriptions: IGroupedSubscription;
  private plural: boolean;
  constructor(subscriptions: ILegacySubscription[]) {
    super({});
    this.plural = subscriptions.length !== 1;
    this.subscriptions = subscriptions.reduce((result, subscription) => {
      result[subscription.authorSlackId] = result[subscription.authorSlackId] || [];
      result[subscription.authorSlackId].push(subscription);
      return result;
    }, Object.create(null));
  }

  public toJSON() {
    const introduction = "Good news: an upgraded GitHub app has been installed in this workspace. " +
      `Type the following slash command${this.plural ? "s" : "" } to ` +
      `keep GitHub working in this channel.`;

    const attachments: IAttachment[] = [
      {
        ...this.getBaseMessage(),
        text: introduction,
      },
    ];
    Object.keys(this.subscriptions).forEach((key) => {
      const attachment: IAttachmentWithFields = {
        ...this.getBaseMessage(),
        fields: [],
        mrkdwn_in: ["fields"],
        pretext: `Configuration${this.plural ? "s" : "" } created by <@${key}>:`,
      };
      this.subscriptions[key].forEach((subscription) => {
        attachment.fields.push({
          value: `\`/github subscribe ${subscription.repoFullName}\``,
        });
      });
      attachments.push(attachment);
    });

    // @todo: Add link to public blog post/FAQ page
    attachments.push({
      ...this.getBaseMessage(),
      mrkdwn_in: ["text"],
      text: "_Need help? Type `/github help` or <https://github.com/github-slack/private-beta|learn more>._",
    });

    return {
      attachments,
      response_type: "in_channel",
    };
  }
};
