const { PullRequest } = require('../../lib/messages/pull-request');
const combinedStatus = require('../fixtures/combined_status.json');
const combinedStatusAllPassing = require('../fixtures/combined_status_all_passing.json');
const combinedStatusSomePassing = require('../fixtures/combined_status_some_passing.json');
const combinedStatusOneFailing = require('../fixtures/combined_status_one_failing.json');

const pullRequestOpened = require('../fixtures/webhooks/pull_request.opened.json');
const pullRequestClosed = require('../fixtures/webhooks/pull_request.closed.json');

const check = require('../fixtures/checks_some_passing.json');

describe('Pull request rendering', () => {
  test('works for notifcation messages', async () => {
    const pullRequest = {
      ...pullRequestOpened.pull_request,
      labels: [],
      requested_reviewers: [{ login: 'user1' }],
      requested_teams: [{ name: 'Test-team', slug: 'test-team' }],
    };
    const prMessage = new PullRequest({
      pullRequest,
      repository: pullRequestOpened.repository,
      eventType: 'pull_request.opened',
      sender: pullRequestOpened.sender,
      reviews: [
        { state: 'CHANGES_REQUESTED', user: { login: 'user2' } },
        { state: 'APPROVED', user: { login: 'user2' } },
      ],
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
      sender: pullRequestOpened.sender,
    });
    const rendered = prMessage.getRenderedMessage();
    expect(rendered).toMatchSnapshot();
  });

  test('works for notifcation messages with some statuses passing', async () => {
    const pullRequest = {
      ...pullRequestOpened.pull_request,
      labels: [],
    };
    const prMessage = new PullRequest({
      pullRequest,
      repository: pullRequestOpened.repository,
      eventType: 'pull_request.opened',
      unfurl: false,
      statuses: combinedStatusSomePassing.statuses,
      sender: pullRequestOpened.sender,
    });
    const rendered = prMessage.getRenderedMessage();
    expect(rendered).toMatchSnapshot();
  });

  test('works for notifcation messages with all statuses passing', async () => {
    const pullRequest = {
      ...pullRequestOpened.pull_request,
      labels: [],
    };
    const prMessage = new PullRequest({
      pullRequest,
      repository: pullRequestOpened.repository,
      eventType: 'pull_request.opened',
      unfurl: false,
      statuses: combinedStatusAllPassing.statuses,
      sender: pullRequestOpened.sender,
    });
    const rendered = prMessage.getRenderedMessage();
    expect(rendered).toMatchSnapshot();
  });

  test('works for notifcation messages with one status failing', async () => {
    const pullRequest = {
      ...pullRequestOpened.pull_request,
      labels: [],
    };
    const prMessage = new PullRequest({
      pullRequest,
      repository: pullRequestOpened.repository,
      eventType: 'pull_request.opened',
      unfurl: false,
      statuses: combinedStatusOneFailing.statuses,
      sender: pullRequestOpened.sender,
    });
    const rendered = prMessage.getRenderedMessage();
    expect(rendered).toMatchSnapshot();
  });

  test('works for notification messages with check runs', async () => {
    const pullRequest = {
      ...pullRequestOpened.pull_request,
      labels: [],
    };
    const prMessage = new PullRequest({
      pullRequest,
      repository: pullRequestOpened.repository,
      eventType: 'pull_request.opened',
      unfurl: false,
      checkRuns: check.check_runs,
      sender: pullRequestOpened.sender,
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
      repository: pullRequestClosed.repository,
      eventType: 'pull_request.closed',
      sender: pullRequestClosed.sender,
    });
    const rendered = prMessage.getRenderedMessage();
    expect(rendered).toMatchSnapshot();
  });

  test('works for full unfurls', async () => {
    const pullRequest = {
      ...pullRequestOpened.pull_request,
      labels: [],
    };
    const prMessage = new PullRequest({
      pullRequest,
      repository: pullRequestOpened.repository,
      unfurlType: 'full',
    });
    const rendered = prMessage.getRenderedMessage();
    expect(rendered).toMatchSnapshot();
  });

  test('works for condensed unfurls', async () => {
    const pullRequest = {
      ...pullRequestOpened.pull_request,
      labels: [],
    };
    const prMessage = new PullRequest({
      pullRequest,
      repository: pullRequestOpened.repository,
      unfurlType: 'condensed',
    });
    const rendered = prMessage.getRenderedMessage();
    expect(rendered).toMatchSnapshot();
  });
});
