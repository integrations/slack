const PromptSignIn = require('../../../lib/messages/unfurls/prompt-sign-in');

describe('Unfurl PromptSignIn message rendering', () => {
  test('works', async () => {
    const message = new PromptSignIn('https://some-url.com/to-log-in?state=probably-with-state');
    expect(message.getAttachment()).toMatchSnapshot();
  });
});
