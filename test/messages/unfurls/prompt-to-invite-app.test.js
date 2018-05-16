const PromptToInviteApp = require('../../../lib/messages/unfurls/prompt-to-invite-app');

describe('PromptToInviteApp message rendering', () => {
  test('works for public channels', async () => {
    const message = new PromptToInviteApp('C12345');
    expect(message.getAttachment()).toMatchSnapshot();
  });

  test('works for private channels', async () => {
    const message = new PromptToInviteApp('G12345');
    expect(message.getAttachment()).toMatchSnapshot();
  });

  test('works for direct messages', async () => {
    const message = new PromptToInviteApp('D12345');
    expect(message.getAttachment()).toMatchSnapshot();
  });
});
