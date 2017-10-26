const { Message } = require('./../../lib/slack/renderer');

const issuesOpened = require('./../fixtures/webhooks/issues.opened.json');

describe('Message rendering', () => {
  test('works for messages with footers', async () => {
    const message = new Message({
      includeFooter: true,
      footerURL: issuesOpened.issue.html_url,
    });
    expect(message.getBaseMessage()).toMatchSnapshot();
  });

  test('works for messages without', async () => {
    const message = new Message({
      includeFooter: false,
    });
    expect(message.getBaseMessage()).toEqual({});
  });
});
