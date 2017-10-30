const { Issue } = require('../../../lib/slack/renderer/issue');

const issuesOpened = require('../../fixtures/webhooks/issues.opened.json');
const issuesClosed = require('../../fixtures/webhooks/issues.closed.json');

describe('Issue rendering', () => {
  test('works for unfurls', async () => {
    const issueMessage = new Issue({
      issue: issuesOpened.issue,
      repository: issuesOpened.repository,
      unfurl: true,
    });
    const rendered = issueMessage.getRenderedMessage();
    expect(rendered).toMatchSnapshot();
  });

  test('works for notification messages', async () => {
    const issueMessage = new Issue({
      issue: issuesOpened.issue,
      repository: issuesOpened.repository,
      eventType: 'issues.opened',
    });
    const rendered = issueMessage.getRenderedMessage();
    expect(rendered).toMatchSnapshot();
  });
  test('works for minor notifications', async () => {
    const issueMessage = new Issue({
      issue: issuesClosed.issue,
      repository: issuesClosed.repository,
      eventType: 'issues.closed',
    });
    const rendered = issueMessage.getRenderedMessage();
    expect(rendered).toMatchSnapshot();
  });
});
