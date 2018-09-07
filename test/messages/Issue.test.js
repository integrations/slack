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

  test('does not render tables', async () => {
    const message = new Issue({
      issue: {
        ...issuesOpened.issue,
        body_html: '<p>Hi, this is my issue and below this line of text there is a table</p>\n<table>\n<thead>\n<tr>\n<th>test</th>\n<th>hello</th>\n<th>hi</th>\n<th>this is</th>\n<th>a table</th>\n</tr>\n</thead>\n<tbody>\n<tr>\n<td>with</td>\n<td>many</td>\n<td>test</td>\n<td>columns</td>\n<td>and</td>\n</tr>\n<tr>\n<td>rows</td>\n<td>ok</td>\n<td></td>\n<td></td>\n<td></td>\n</tr>\n<tr>\n<td></td>\n<td></td>\n<td></td>\n<td>third</td>\n<td>row!</td>\n</tr></tbody></table>',
      },
      repository: issuesOpened.repository,
      eventType: 'issues.opened',
    });
    expect(message.getRenderedMessage()).toMatchSnapshot();
  });
});
