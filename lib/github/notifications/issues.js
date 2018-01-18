const cache = require('../../cache');
const { Issue } = require('./../../slack/renderer/issue');

async function updateIssueMessage(messageMetaData, context, subscription, slack) {
  // Fetch updated version of issue to retrieve accurate comment count and body_html
  const issue = (await context.github.issues.get(context.issue({
    headers: { accept: 'application/vnd.github.html+json' },
  }))).data;

  const issueMessage = new Issue({
    issue,
    repository: context.payload.repository,
    eventType: 'issues.opened',
  });
  // 3rd argument is required in API wrapper, but not in API (We don't want to use it in this case)
  const res = await slack.chat.update(messageMetaData.ts, messageMetaData.channel, '', issueMessage.getRenderedMessage());
  context.log(res, 'Updated Slack message');
}

async function matchMetaDataStatetoIssueMessage(context, subscription, slack) {
  const { id } = context.payload.issue;
  // @TODO: Make cache key depend on subscription
  const storedMetaData = await cache.get(id);
  if (storedMetaData) {
    updateIssueMessage(storedMetaData, context, subscription, slack);
  }
}

async function issueEvent(context, subscription, slack) {
  const eventType = `${context.event}.${context.payload.action}`;

  // Fetch updated version of issue to retrieve body_html
  const issue = (await context.github.issues.get(context.issue({
    headers: { accept: 'application/vnd.github.html+json' },
  }))).data;

  const issueMessage = new Issue({
    issue,
    repository: context.payload.repository,
    eventType,
    sender: context.payload.sender,
  });

  // 2nd argument is required in API wrapper, but not in API (We don't want to use it in this case)
  const res = await slack.chat.postMessage(subscription.channelId, '', issueMessage.getRenderedMessage());
  context.log(res, 'Posted Slack message');

  const messageMetaData = {
    channel: res.channel,
    ts: res.ts,
  };

  if (eventType === 'issues.opened') {
    // save major message meta data by issue id
    await cache.set(context.payload.issue.id, messageMetaData);
  } else {
    await matchMetaDataStatetoIssueMessage(context);
  }
}

module.exports = {
  matchMetaDataStatetoIssueMessage,
  issueEvent,
};
