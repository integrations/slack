const slack = require('../../slack/client');

const { PullRequest } = require('../../slack/renderer/PullRequest');

const { get, set } = require('../../storage');

async function pullRequestEvent(context) {
  const eventType = `${context.event}.${context.payload.action}`;
  console.log(eventType);
  // need seperate api request to get labels
  const issue = (
    await context.github.issues.get({
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
      number: context.payload.pull_request.number,
    })
  ).data;

  const pullRequest = {
    ...context.payload.pull_request,
    labels: issue.labels,
  };
  const prMessage = new PullRequest({
    pullRequest,
    repository: context.payload.repository,
    eventType,
  });
  // 2nd argument is required in API wrapper, but not in API (We don't want to use it in this case)
  slack.web.chat.postMessage('#general', '', prMessage.getRenderedMessage(), (err, res) => {
    if (err) {
      console.log('Error:', err);
    } else {
      console.log('Message sent: ', res);
      const messageMetaData = {
        channel: res.channel,
        ts: res.ts,
        context: context.issue(),
      };
      if (eventType === 'pull_request.opened') {
        set(`pull-${context.payload.pull_request.id}`, messageMetaData); // store PR id so that the PR can be mapped to the slack message
      }
    }
  });
}

function storePRMapping(context) {
  set(`status-${context.payload.pull_request.head.sha}`, context.payload.pull_request.id); // store sha so that status events can be linked back to PR
}

async function onStatus(context) {
  // we should obtain the new PR data, not the old one
  const id = await get(`status-${context.payload.sha}`);
  const message = await get(`pull-${id}`);
  const pull = (await context.github.pullRequests.get(message.context)).data;
  const issue = (await context.github.issues.get(message.context)).data;
  const statuses = (await context.github.repos.getCombinedStatusForRef(context.repo({
    ref: context.payload.sha,
    headers: { accept: 'application/vnd.github.slack-preview+json' },
  }))).data.statuses;

  const pullRequest = {
    ...pull,
    labels: issue.labels,
  };

  const prMessage = new PullRequest({
    pullRequest,
    repository: pullRequest.base.repo,
    eventType: 'pull_request.opened',
    statuses,
  });

  // 2nd argument is required in API wrapper, but not in API (We don't want to use it in this case)
  slack.web.chat.update(message.ts, message.channel, '', prMessage.getRenderedMessage(), (err, res) => {
    if (err) {
      console.log('Error:', err);
    } else {
      console.log('Message sent: ', res);
    }
  });
}

module.exports = {
  pullRequestEvent,
  storePRMapping,
  onStatus,
};
