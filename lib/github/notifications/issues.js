const slack = require('../../slack/client');

const { get, set } = require('./../../storage');
const { Issue } = require('./../../slack/renderer/issue');

async function updateIssueMessage(messageMetaData, context) {
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
  const res = await slack.web.chat.update(messageMetaData.ts, messageMetaData.channel, '', issueMessage.getRenderedMessage());
  context.log(res, 'Updated Slack message');
}

async function matchMetaDataStatetoIssueMessage(context) {
  const id = context.payload.issue.id;
  const storedMetaData = await get(id);
  if (storedMetaData) {
    updateIssueMessage(storedMetaData, context);
  }
}

async function issueEvent(context, channel) {
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
  const res = await slack.web.chat.postMessage(channel, '', issueMessage.getRenderedMessage());
  context.log(res, 'Posted Slack message');

  const messageMetaData = {
    channel: res.channel,
    ts: res.ts,
  };

  if (eventType === 'issues.opened') {
    // save major message meta data by issue id
    await set(context.payload.issue.id, messageMetaData);
  } else {
    await matchMetaDataStatetoIssueMessage(context);
  }
}

module.exports = {
  matchMetaDataStatetoIssueMessage,
  issueEvent,
};
