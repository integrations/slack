const { Message } = require('../');

module.exports = class ActivateLegacySubscriptions extends Message {
  constructor(subscriptions) {
    super({});
    this.plural = subscriptions.length !== 1;
    this.subscriptions = subscriptions.reduce((result, subscription) => {
      // eslint-disable-next-line no-param-reassign
      result[subscription.authorSlackId] = result[subscription.authorSlackId] || [];
      result[subscription.authorSlackId].push(subscription);
      return result;
    }, Object.create(null));
  }

  toJSON() {
    const introduction = 'Good news: an upgraded GitHub app has been installed in this workspace. ' +
      `Type the following slash command${this.plural ? 's' : ''} to ` +
      'keep GitHub working in this channel.';

    const attachments = [
      {
        ...this.getBaseMessage(),
        text: introduction,
      },
    ];
    Object.keys(this.subscriptions).forEach((key) => {
      const attachment = {
        ...this.getBaseMessage(),
        fields: [],
        mrkdwn_in: ['fields'],
        pretext: `Configuration${this.plural ? 's' : ''} created by <@${key}>:`,
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
      mrkdwn_in: ['text'],
      text: '_Need help? Type `/github help` or <https://get.slack.help/hc/en-us/articles/232289568-GitHub-for-Slack|learn more>._',
    });

    return {
      attachments,
      response_type: 'in_channel',
    };
  }
};
