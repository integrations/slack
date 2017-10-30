const { PullRequest } = require('../../../lib/slack/renderer/pull-request');
const combinedStatus = require('../../fixtures/combined_status.json');

const pullRequestOpened = require('../../fixtures/webhooks/pull_request.opened.json');
const pullRequestClosed = require('../../fixtures/webhooks/pull_request.closed.json');

describe('Pull request rendering', () => {
  test('works for notifcation messages', async () => {
    const pullRequest = {
      ...pullRequestOpened.pull_request,
      labels: [],
    };
    const prMessage = new PullRequest({
      pullRequest,
      repository: pullRequestOpened.repository,
      eventType: 'pull_request.opened',
    });
    const rendered = prMessage.getRenderedMessage();
    expect(rendered).toMatchSnapshot();
  });

  test('works for notifcation messages with statuses', async () => {
    const pullRequest = {
      ...pullRequestOpened.pull_request,
      labels: [],
    };
    const prMessage = new PullRequest({
      pullRequest,
      repository: pullRequestOpened.repository,
      eventType: 'pull_request.opened',
      unfurl: false,
      statuses: combinedStatus.statuses,
    });
    const rendered = prMessage.getRenderedMessage();
    expect(rendered).toMatchSnapshot();
  });

  test('works for minor notifications', async () => {
    const pullRequest = {
      ...pullRequestClosed.pull_request,
      labels: [],
    };
    const prMessage = new PullRequest({
      pullRequest,
      repository: pullRequestOpened.repository,
      eventType: 'pull_request.closed',
    });
    const rendered = prMessage.getRenderedMessage();
    expect(rendered).toMatchSnapshot();
  });

  test('works for unfurls', async () => {
    const pullRequest = {
      ...pullRequestOpened.pull_request,
      labels: [],
    };
    const prMessage = new PullRequest({
      pullRequest,
      repository: pullRequestOpened.repository,
      eventType: 'pull_request.opened',
      unfurl: true,
    });
    const rendered = prMessage.getRenderedMessage();
    expect(rendered).toMatchSnapshot();
  });
});
