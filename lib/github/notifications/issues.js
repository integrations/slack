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

async function issueOpened(context) {
  const issueMessage = new Issue({
    issue: context.payload.issue,
    repository: context.payload.repository,
    eventType: 'issues.opened',
  });
  // 2nd argument is required in API wrapper, but not in API (We don't want to use it in this case)
  slack.web.chat.postMessage('#general', '', issueMessage.getRenderedMessage(), (err, res) => {
    if (err) {
      console.log('Error:', err);
    } else {
      console.log('Message sent: ', res);
      const messageMetaData = {
        channel: res.channel,
        ts: res.ts,
      };
      set(context.payload.issue.id, messageMetaData);
    }
  });
}

async function issueClosed(context) {
  const issueMessage = new Issue({
    issue: context.payload.issue,
    repository: context.payload.repository,
    eventType: 'issues.closed',
  });
  // 2nd argument is required in API wrapper, but not in API (We don't want to use it in this case)
  slack.web.chat.postMessage('#general', '', issueMessage.getRenderedMessage(), (err, res) => {
    if (err) {
      console.log('Error:', err);
    } else {
      console.log('Message sent: ', res);
    }
  });

  const id = context.payload.issue.id;
  const storedMetaData = await get(id);
  const messageMetaData = JSON.parse(storedMetaData);
  updateIssueMessage(messageMetaData, context);
}

async function issueReopened(context) {
  const issueMessage = new Issue({
    issue: context.payload.issue,
    repository: context.payload.repository,
    eventType: 'issues.reopened',
  });
  // 2nd argument is required in API wrapper, but not in API (We don't want to use it in this case)
  slack.web.chat.postMessage('#general', '', issueMessage.getRenderedMessage(), (err, res) => {
    if (err) {
      console.log('Error:', err);
    } else {
      console.log('Message sent: ', res);
    }
  });

  const id = context.payload.issue.id;
  const storedMetaData = await get(id);
  const messageMetaData = JSON.parse(storedMetaData);
  updateIssueMessage(messageMetaData, context);
}

module.exports = {
  matchMetaDataStatetoIssueMessage,
  issueOpened,
  issueClosed,
  issueReopened,
};
