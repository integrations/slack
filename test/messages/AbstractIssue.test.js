const { AbstractIssue } = require('../../lib/messages/abstract-issue');
const { constants } = require('../../lib/messages');

const fixtures = require('../fixtures');
const issuesOpened = require('../fixtures/webhooks/issues.opened.json');

describe('AbstractIssue rendering', () => {
  let abstractIssueMessage;

  beforeEach(() => {
    abstractIssueMessage = new AbstractIssue({
      abstractIssue: issuesOpened.issue,
      repository: issuesOpened.repository,
      eventType: 'issues.opened',
      unfurl: false,
      sender: issuesOpened.sender,
    });
  });
  test('works for getHexColorbyState', async () => {
    const color = AbstractIssue.getHexColorbyState(issuesOpened.issue.state);
    expect(color).toEqual(constants.OPEN_GREEN);
  });

  test('works for getAuthor', async () => {
    expect(abstractIssueMessage.getAuthor()).toEqual({
      author_name: 'wilhelmklopp',
      author_link: 'https://github.com/wilhelmklopp',
      author_icon: 'https://avatars1.githubusercontent.com/u/7718702?v=4',
    });
  });

  test('works for getPreText', async () => {
    expect(abstractIssueMessage.getPreText('Issue')).toEqual('Issue opened by wilhelmklopp');
  });

  test('works for getPreText (without sender)', async () => {
    abstractIssueMessage = new AbstractIssue({
      abstractIssue: issuesOpened.issue,
      repository: issuesOpened.repository,
      eventType: 'issues.opened',
    });
    expect(abstractIssueMessage.getPreText('Issue')).toEqual('Issue opened by wilhelmklopp');
  });

  test('works for core', async () => {
    expect(abstractIssueMessage.getCore()).toEqual({
      text: issuesOpened.issue.body,
      title: `#${issuesOpened.issue.number} ${issuesOpened.issue.title}`,
      fallback: `[${issuesOpened.repository.full_name}] #${issuesOpened.issue.number} ${issuesOpened.issue.title}`,
      title_link: issuesOpened.issue.html_url,
    });
  });

  test('works for getBaseMessage', async () => {
    expect(abstractIssueMessage.getBaseMessage()).toMatchSnapshot();
  });

  test('converts HTML body to mrkdwn', () => {
    const message = new AbstractIssue({
      abstractIssue: Object.assign({
        body_html: '<strong>Hello</strong> <em>cruel</em> <a href="http://example.com">world</a>',
      }, fixtures.issue),
      repository: fixtures.repo,
      unfurlType: 'full',
    });

    expect(message.getCore().text).toEqual('*Hello* _cruel_ <http://example.com|world>');
  });
});
