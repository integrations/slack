const slack = require('../../slack/client');

const { Push } = require('../../slack/renderer/push');

async function push(context, channel) {
  if (
      context.payload.repository.default_branch ===
      context.payload.ref.replace('refs/heads/', '')
  ) {
    const pushMessage = new Push({
      push: context.payload,
    });

    slack.web.chat.postMessage(channel, '', pushMessage.getRenderedMessage(), async (err, res) => {
      if (err) {
        console.log('Error:', err);
      } else {
        console.log('Message sent: ', res);
      }
    });
  }
}

module.exports = {
  push,
};
