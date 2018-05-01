const MutePromptsPrompt = require('../../../lib/messages/unfurls/mute-prompts-prompt');

describe('AutoUnfurlPrompt message rendering', () => {
  test('works', async () => {
    const message = new MutePromptsPrompt();
    expect(message.getAttachment()).toMatchSnapshot();
  });
});
