const { PullRequest } = require('../messages/pull-request');

const cache = require('../cache');

async function getReviews(context, pullRequest) {
  const reviews = await context.github.pullRequests.getReviews({
    owner: context.payload.repository.owner.login,
    repo: context.payload.repository.name,
    number: pullRequest.number,
  });
  return reviews.data;
}

async function pullRequestEvent(context, subscription, slack) {
  let pullRequest = {
    ...context.payload.pull_request,
  };
  if (context.payload.action === 'opened') {
    // need seperate api request to get labels, body_html, requested_reviewers and requested_teams
    pullRequest = (await context.github.pullRequests.get(context.issue({
      headers: {
        accept: ['application/vnd.github.html+json', 'application/vnd.github.shadow-cat-preview'],
      },
    }))).data;
  }

  const eventType = `${context.event}.${context.payload.action}`;

  const reviews = await getReviews(context, pullRequest);
  const prMessage = new PullRequest({
    pullRequest,
    repository: context.payload.repository,
    eventType,
    sender: context.payload.sender,
    reviews,
  });

  const res = await slack.chat.postMessage({
    channel: subscription.channelId,
    ...prMessage.getRenderedMessage(),
  });
  context.log(res, 'Posted Slack message');

  const messageMetaData = {
    channel: res.channel,
    ts: res.ts,
    context: context.issue(),
  };
  if (eventType === 'pull_request.opened') {
    // store PR id so that the PR can be mapped to the slack message
    const cacheKey = subscription.cacheKey(`pull#${context.payload.pull_request.id}`);
    cache.set(cacheKey, messageMetaData);
  }
}

function storePRMapping(context) {
  // store sha so that status events can be linked back to PR
  const cacheKey = `repo#${context.payload.repository.id}:status#${context.payload.pull_request.head.sha}`;
  cache.set(cacheKey, context.payload.pull_request.id);
}

async function onStatus(context, subscription, slack) {
  // we should obtain the new PR data, not the old one
  const id = await cache.get(`repo#${context.payload.repository.id}:status#${context.payload.sha}`);
  const cacheKey = subscription.cacheKey(`pull#${id}`);
  const message = await cache.get(cacheKey);

  if (!message) {
    context.log.debug({ sha: context.payload.sha }, 'Could not find pull request for status');
    return;
  }

  const pull = (await context.github.pullRequests.get({ ...message.context })).data;
  const issue = (await context.github.issues.get(Object.assign({
    headers: { accept: 'application/vnd.github.html+json' },
  }, { ...message.context }))).data;

  const { statuses } = (await context.github.repos.getCombinedStatusForRef(context.repo({
    ref: context.payload.sha,
  }))).data;

  const pullRequest = {
    ...pull,
    labels: issue.labels,
    body_html: issue.body_html,
  };

  const reviews = await getReviews(context, pullRequest);
  const prMessage = new PullRequest({
    pullRequest,
    repository: pullRequest.base.repo,
    eventType: 'pull_request.opened',
    statuses,
    reviews,
  });

  const { ts, channel } = message;
  const res = await slack.chat.update({
    ts,
    channel,
    ...prMessage.getRenderedMessage(),
  });
  context.log(res, 'Updated Slack message');
}

async function onCheckRun(context, subscription, slack) {
  // we should obtain the new PR data, not the old one
  const sha = context.payload.check_run.check_suite.head_sha;
  const id = await cache.get(`repo#${context.payload.repository.id}:status#${sha}`);
  const cacheKey = subscription.cacheKey(`pull#${id}`);
  const message = await cache.get(cacheKey);

  if (!message) {
    context.log.debug({ sha: sha }, 'Could not find pull request for check run');
    return;
  }

  const pull = (await context.github.pullRequests.get({ ...message.context })).data;
  const issue = (await context.github.issues.get(Object.assign({
    headers: { accept: 'application/vnd.github.html+json' },
  }, { ...message.context }))).data;

  const { statuses } = (await context.github.repos.getCombinedStatusForRef(context.repo({
    ref: sha,
  }))).data;

  const { check_runs: checkRuns } = (await context.github.checks.listForRef(context.repo({
    ref: sha,
  }))).data;

  const pullRequest = {
    ...pull,
    labels: issue.labels,
    body_html: issue.body_html,
  };

  const reviews = await getReviews(context, pullRequest);
  const prMessage = new PullRequest({
    pullRequest,
    repository: pullRequest.base.repo,
    eventType: 'pull_request.opened',
    statuses,
    checkRuns,
    reviews,
  });

  const { ts, channel } = message;
  const res = await slack.chat.update({
    ts,
    channel,
    ...prMessage.getRenderedMessage(),
  });
  context.log(res, 'Updated Slack message');
}

module.exports = {
  pullRequestEvent,
  storePRMapping,
  onStatus,
  onCheckRun,
};
