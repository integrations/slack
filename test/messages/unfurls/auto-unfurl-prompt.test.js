const AutoUnfurlPrompt = require('../../../lib/messages/unfurls/auto-unfurl-prompt');

describe('AutoUnfurlPrompt message rendering', () => {
  test('works', async () => {
    const unfurl = {
      githubRepoId: 12345678,
      channelSlackId: 'C12345',
    };
    const team = {
      domain: 'bestslackteam',
    };
    const message = new AutoUnfurlPrompt('integrations', 'snappydoo', unfurl, team);
    expect(message.getAttachment()).toMatchSnapshot();
  });
});
