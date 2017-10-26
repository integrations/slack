const { AbstractIssue } = require('./../../lib/slack/renderer/AbstractIssue');
const { constants } = require('./../../lib/slack/renderer');

const issuesOpened = require('./../fixtures/webhooks/issues.opened.json');

describe('AbstractIssue rendering', () => {
  let abstractIssueMessage;

  beforeEach(() => {
    abstractIssueMessage = new AbstractIssue({
      abstractIssue: issuesOpened.issue,
      repository: issuesOpened.repository,
      eventType: 'issues.opened',
      unfurl: false,
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
    expect(abstractIssueMessage.getPreText('Issue')).toEqual(
      '[github-slack/public-test] Issue opened by wilhelmklopp',
    );
  });

  test('works for core', async () => {
    expect(abstractIssueMessage.getCore()).toEqual({
      text: issuesOpened.issue.body,
      title: `#${issuesOpened.issue.number} ${issuesOpened.issue.title}`,
      fallback: `#${issuesOpened.issue.number} ${issuesOpened.issue.title}`,
      title_link: issuesOpened.issue.html_url,
    });
  });

  test('works for getFooter', async () => {
    expect(abstractIssueMessage.getFooter()).toEqual({
      footer: `<${issuesOpened.issue.html_url}|View it on GitHub>`,
      footer_icon: 'https://assets-cdn.github.com/favicon.ico',
    });
  });

  test('works for getBaseMessage', async () => {
    expect(abstractIssueMessage.getBaseMessage()).toMatchSnapshot();
  });
});
