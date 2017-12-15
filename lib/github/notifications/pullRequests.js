const { PullRequest } = require('../../slack/renderer/pull-request');

const { get, set } = require('../../storage');

async function pullRequestEvent(context, subscription, slack) {
  const eventType = `${context.event}.${context.payload.action}`;
  // need seperate api request to get labels and body_html
  const issue = (await context.github.issues.get(context.issue({
    headers: { accept: 'application/vnd.github.html+json' },
  }))).data;

  const pullRequest = {
    ...context.payload.pull_request,
    labels: issue.labels,
    body_html: issue.body_html,
  };

  const prMessage = new PullRequest({
    pullRequest,
    repository: context.payload.repository,
    eventType,
    sender: context.payload.sender,
  });
  // 2nd argument is required in API wrapper, but not in API (We don't want to use it in this case)
  const res = await slack.chat.postMessage(subscription.channelId, '', prMessage.getRenderedMessage());
  context.log(res, 'Posted Slack message');

  const messageMetaData = {
    channel: res.channel,
    ts: res.ts,
    context: context.issue(),
  };
  if (eventType === 'pull_request.opened') {
    set(`pull-${context.payload.pull_request.id}`, messageMetaData); // store PR id so that the PR can be mapped to the slack message
  }
}

function storePRMapping(context) {
  set(`status-${context.payload.pull_request.head.sha}`, context.payload.pull_request.id); // store sha so that status events can be linked back to PR
}

async function onStatus(context, subscription, slack) {
  // we should obtain the new PR data, not the old one
  const id = await get(`status-${context.payload.sha}`);
  const message = await get(`pull-${id}`);

  if (!message) {
    return;
  }

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
  const res = await slack.chat.update(message.ts, message.channel, '', prMessage.getRenderedMessage());
  context.log(res, 'Updated Slack message');
}

module.exports = {
  pullRequestEvent,
  storePRMapping,
  onStatus,
};
