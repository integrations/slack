const { GollumMessage } = require('../messages/gollum');

async function gollumEvent(context, subscription, slack) {
  const gollum = context.payload;
  const gollumMessage = new GollumMessage({ gollum });

  const res = await slack.chat.postMessage({
    channel: subscription.channelId,
    attachments: [gollumMessage.getRenderedMessage()],
  });
  context.log(res, 'Posted Slack Message');
}

module.exports = {
  gollumEvent,
};
