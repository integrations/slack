const { Issue } = require('./../../lib/renderer');
const issuesOpened = require('./../fixtures/webhooks/issues.opened.json');
const issuesClosed = require('./../fixtures/webhooks/issues.closed.json');


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
