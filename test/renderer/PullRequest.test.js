const { PullRequest } = require('./../../lib/slack/renderer/PullRequest');
const combinedStatus = require('./../fixtures/combined_status.json');

const pullRequestOpened = require('./../fixtures/webhooks/pull_request.opened.json');
const pullRequestClosed = require('./../fixtures/webhooks/pull_request.closed.json');

describe('Pull request rendering', () => {
  test('works for notifcation messages', async () => {
    const pullRequest = {
      ...pullRequestOpened.pull_request,
      labels: [],
    };
    const prMessage = new PullRequest(
      pullRequest,
      pullRequestOpened.repository,
      'pull_request.opened',
      false,
      null,
    );
    const rendered = prMessage.getRenderedMessage();
    expect(rendered).toMatchSnapshot();
  });

  test('works for notifcation messages with statuses', async () => {
    const pullRequest = {
      ...pullRequestOpened.pull_request,
      labels: [],
    };
    const prMessage = new PullRequest(
      pullRequest,
      pullRequestOpened.repository,
      'pull_request.opened',
      false,
      combinedStatus.statuses,
    );
    const rendered = prMessage.getRenderedMessage();
    expect(rendered).toMatchSnapshot();
  });

  test('works for minor notifications', async () => {
    const pullRequest = {
      ...pullRequestClosed.pull_request,
      labels: [],
    };
    const prMessage = new PullRequest(
      pullRequest,
      pullRequestOpened.repository,
      'pull_request.closed',
      false,
      null,
    );
    const rendered = prMessage.getRenderedMessage();
    expect(rendered).toMatchSnapshot();
  });

  test('works for unfurls', async () => {
    const pullRequest = {
      ...pullRequestOpened.pull_request,
      labels: [],
    };
    const prMessage = new PullRequest(
      pullRequest,
      pullRequestOpened.repository,
      'pull_request.opened',
      true,
      null,
    );
    const rendered = prMessage.getRenderedMessage();
    expect(rendered).toMatchSnapshot();
  });
});
