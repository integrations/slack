const { SignInMessage } = require('../../../../lib/slack/renderer/flow');

describe('SignInMessage rendering', () => {
  test('works', async () => {
    const message = new SignInMessage({
      signInlink: 'https://example.org/github/oauth/login?state=abcdef',
    });
    expect(message.getRenderedMessage()).toMatchSnapshot();
  });
});
