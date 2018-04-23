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

  test('extracts image from body_html', () => {
    const message = new Issue({
      issue: {
        ...issuesOpened.issue,
        body_html: '<p>Hello world!</p><p><img src="https://media.giphy.com/media/5xtDarEbygs3Pu7p3jO/giphy.gif"></p>',
      },
      repository: issuesOpened.repository,
      unfurlType: 'full',
    });
    expect(message.getRenderedMessage()).toMatchSnapshot();
  });
});
