const slack = require('../../slack/client');

const { get, set } = require('./../../storage');
const { Issue } = require('./../../slack/renderer/issue');

async function updateIssueMessage(messageMetaData, context) {
  // Fetch updated version of issue to retrieve accurate comment count
  const issue = (await context.github.issues.get({
    owner: context.payload.repository.owner.login,
    repo: context.payload.repository.name,
    number: context.payload.issue.number,
  })).data;

  const issueMessage = new Issue({
    issue,
    repository: context.payload.repository,
    eventType: 'issues.opened',
  });
  // 3rd argument is required in API wrapper, but not in API (We don't want to use it in this case)
  slack.web.chat.update(messageMetaData.ts, messageMetaData.channel, '', issueMessage.getRenderedMessage(), (err, res) => {
    if (err) {
      console.log('Error:', err);
    } else {
      console.log('Message sent: ', res);
    }
  });
}

async function matchMetaDataStatetoIssueMessage(context) {
  const id = context.payload.issue.id;
  const storedMetaData = await get(id);
  updateIssueMessage(storedMetaData, context);
}

async function issueEvent(context, channel) {
  const eventType = `${context.event}.${context.payload.action}`;

  const issueMessage = new Issue({
    issue: context.payload.issue,
    repository: context.payload.repository,
    eventType,
    sender: context.payload.sender,
  });

  // 2nd argument is required in API wrapper, but not in API (We don't want to use it in this case)
  slack.web.chat.postMessage(channel, '', issueMessage.getRenderedMessage(), async (err, res) => {
    if (err) {
      console.log('Error:', err);
    } else {
      console.log('Message sent: ', res);
      const messageMetaData = {
        channel: res.channel,
        ts: res.ts,
      };
      if (eventType === 'issues.opened') {
        // save major message meta data by issue id
        set(context.payload.issue.id, messageMetaData);
      } else {
        matchMetaDataStatetoIssueMessage(context);
      }
    }
  });
}

module.exports = {
  matchMetaDataStatetoIssueMessage,
  issueEvent,
};
