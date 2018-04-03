const PrivateUnfurlPrompt = require('../../../lib/messages/unfurls/private-unfurl-prompt');

describe('PrivateUnfurlPrompt message rendering', () => {
  test('works', async () => {
    const unfurl = {
      id: 1,
      url: 'https://github.com/electron/electron',
    };
    const message = new PrivateUnfurlPrompt(unfurl);
    expect(message.getAttachment()).toMatchSnapshot();
  });
});
