const { Issue, PullRequest } = require('./../../lib/renderer');
const issuesOpened = require('./../fixtures/webhooks/issues.opened.json');
const issuesClosed = require('./../fixtures/webhooks/issues.closed.json');
const combinedStatus = require('./../fixtures/combined_status.json');

const pullRequestOpened = require('./../fixtures/webhooks/pull_request.opened.json');
const pullRequestClosed = require('./../fixtures/webhooks/pull_request.closed.json');

// once everything extends Message,
// we should `expect` there to be a fallback
describe('Issue rendering', () => {
  test('works for unfurls', async () => {
    const issueMessage = new Issue(
      issuesOpened.issue,
      issuesOpened.repository,
      'issues.opened',
      true,
    );
    const rendered = issueMessage.getRenderedMessage();
    expect(rendered).toMatchSnapshot();
  });

  test('works for notification messages', async () => {
    const issueMessage = new Issue(
      issuesOpened.issue,
      issuesOpened.repository,
      'issues.opened',
      false,
    );
    const rendered = issueMessage.getRenderedMessage();
    expect(rendered).toMatchSnapshot();
  });
  test('works for minor notifications', async () => {
    const issueMessage = new Issue(
      issuesClosed.issue,
      issuesClosed.repository,
      'issues.closed',
      false,
    );
    const rendered = issueMessage.getRenderedMessage();
    expect(rendered).toMatchSnapshot();
  });
});

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
