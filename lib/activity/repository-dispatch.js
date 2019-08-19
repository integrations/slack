const repositoryDispatchBlocks = require('../messages/repository-dispatch');

async function repositoryDispatch(context, subscription, slack) {
  const eventType = `${context.event}.${context.payload.action}`;
  // BUild this in block kit

  // The payload we'd accept would also be block kit probably

  // Can pass a section block?


  const res = await slack.chat.postMessage({
    channel: subscription.channelId,
    blocks: repositoryDispatchBlocks(context.payload)
  });
  context.log(res, 'Posted Slack message');
}

module.exports = {
  repositoryDispatch,
};
