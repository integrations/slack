const cache = require('../cache');
const { Issue } = require('../messages/issue');

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

  const { ts, channel } = messageMetaData;
  const res = await slack.chat.update({
    ts,
    channel,
    ...issueMessage.getRenderedMessage(),
  });
  context.log(res, 'Updated Slack message');
}

async function matchMetaDataStatetoIssueMessage(context, subscription, slack) {
  const cacheKey = subscription.cacheKey(`issue#${context.payload.issue.id}`);
  const storedMetaData = await cache.get(cacheKey);
  if (storedMetaData) {
    await updateIssueMessage(storedMetaData, context, subscription, slack);
  }
}

async function issueEvent(context, subscription, slack) {
  let issue = {
    ...context.payload.issue,
  };
  if (context.payload.action === 'opened') {
    // Fetch updated version of issue to retrieve body_html
    issue = (await context.github.issues.get(context.issue({
      headers: { accept: 'application/vnd.github.html+json' },
    }))).data;
  }

  const eventType = `${context.event}.${context.payload.action}`;

  const issueMessage = new Issue({
    issue,
    repository: context.payload.repository,
    eventType,
    sender: context.payload.sender,
  });

  // 2nd argument is required in API wrapper, but not in API (We don't want to use it in this case)
  const res = await slack.chat.postMessage({
    channel: subscription.channelId,
    ...issueMessage.getRenderedMessage(),
  });
  context.log(res, 'Posted Slack message');

  const messageMetaData = {
    channel: res.channel,
    ts: res.ts,
  };

  if (eventType === 'issues.opened') {
    // save major message meta data by issue id
    const cacheKey = subscription.cacheKey(`issue#${context.payload.issue.id}`);
    await cache.set(cacheKey, messageMetaData);
  } else {
    await matchMetaDataStatetoIssueMessage(context, subscription, slack);
  }
}

module.exports = {
  matchMetaDataStatetoIssueMessage,
  issueEvent,
};
