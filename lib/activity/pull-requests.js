const { PullRequest } = require('../messages/pull-request');

const cache = require('../cache');

async function getReviews(context, pullRequest) {
  const reviews = await context.github.pullRequests.listReviews({
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
  if (!['closed', 'reopened'].includes(context.payload.action)) {
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
    format: subscription.getFormatSetting(),
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
  if (eventType === 'pull_request.opened' || eventType === 'pull_request.ready_for_review') {
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

async function getMessageFromCache(id, subscription) {
  const cacheKey = subscription.cacheKey(`pull#${id}`);
  return cache.get(cacheKey);
}

async function getCombinedStatusForRef(context, sha) {
  return (await context.github.repos.getCombinedStatusForRef(context.repo({
    ref: sha,
  }))).data.statuses;
}

async function getChecksListForRef(context, sha) {
  return (await context.github.checks.listForRef(context.repo({
    ref: sha,
  }))).data.check_runs;
}

async function getPullRequest(context, message) {
  return (await context.github.pullRequests.get({ ...message.context })).data;
}

async function getIssue(context, message) {
  return (await context.github.issues.get(Object.assign({
    headers: { accept: 'application/vnd.github.html+json' },
  }, { ...message.context }))).data;
}

async function updateSlackMessage(context, message, prMessage, slack) {
  const { ts, channel } = message;
  const res = await slack.chat.update({
    ts,
    channel,
    ...prMessage.getRenderedMessage(),
  });
  context.log(res, 'Updated Slack message');
}

async function onStatusOrCheckRun(context, subscription, slack) {
  let sha;
  let id;

  if (context.event === 'status') {
    ({ sha } = context.payload);
    id = await cache.get(`repo#${context.payload.repository.id}:status#${context.payload.sha}`);
  } else if (context.event === 'check_run') {
    ({ head_sha: sha } = context.payload.check_run.check_suite);
    id = await cache.get(`repo#${context.payload.repository.id}:status#${sha}`);
  }

  const message = await getMessageFromCache(id, subscription);

  if (!message) {
    context.log.debug({ sha }, `Could not find pull request for ${context.event}`);
    return;
  }

  const [statuses, checkRuns, pull, issue] = await Promise.all([
    await getCombinedStatusForRef(context, sha),
    await getChecksListForRef(context, sha),
    await getPullRequest(context, message),
    await getIssue(context, message),
  ]);

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
    format: subscription.getFormatSetting(),
  });

  await updateSlackMessage(context, message, prMessage, slack);
}

module.exports = {
  pullRequestEvent,
  storePRMapping,
  onStatusOrCheckRun,
};
