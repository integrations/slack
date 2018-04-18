const PromptSignIn = require('../../../lib/messages/unfurls/prompt-sign-in');

describe('Unfurl PromptSignIn message rendering', () => {
  test('works', async () => {
    const message = new PromptSignIn();
    expect(message.getAttachment()).toMatchSnapshot();
  });
});
