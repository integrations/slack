const { Issue } = require('../../lib/messages/issue');

const issuesOpened = require('../fixtures/webhooks/issues.opened.json');
const issuesClosed = require('../fixtures/webhooks/issues.closed.json');

describe('Issue rendering', () => {
  test('works for full unfurls', async () => {
    const issueMessage = new Issue({
      issue: issuesOpened.issue,
      repository: issuesOpened.repository,
      unfurlType: 'full',
    });
    const rendered = issueMessage.getRenderedMessage();
    expect(rendered).toMatchSnapshot();
  });

  test('works for condensed unfurls', async () => {
    const issueMessage = new Issue({
      issue: issuesOpened.issue,
      repository: issuesOpened.repository,
      unfurlType: 'condensed',
    });
    const rendered = issueMessage.getRenderedMessage();
    expect(rendered).toMatchSnapshot();
  });

  test('works for notification messages', async () => {
    const issueMessage = new Issue({
      issue: issuesOpened.issue,
      repository: issuesOpened.repository,
      eventType: 'issues.opened',
      sender: issuesOpened.sender,
    });
    const rendered = issueMessage.getRenderedMessage();
    expect(rendered).toMatchSnapshot();
  });
  test('works for minor notifications', async () => {
    const issueMessage = new Issue({
      issue: issuesClosed.issue,
      repository: issuesClosed.repository,
      eventType: 'issues.closed',
      sender: issuesClosed.sender,
    });
    const rendered = issueMessage.getRenderedMessage();
    expect(rendered).toMatchSnapshot();
  });
});
