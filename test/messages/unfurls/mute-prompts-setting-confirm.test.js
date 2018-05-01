const MutePromptsSettingConfirm = require('../../../lib/messages/unfurls/mute-prompts-setting-confirm');

describe('MutePromptsSettingConfirm message rendering', () => {
  test('works for 24h', async () => {
    const message = new MutePromptsSettingConfirm('for 24h');
    expect(message.getAttachment()).toMatchSnapshot();
  });

  test('works indefinitely', async () => {
    const message = new MutePromptsSettingConfirm('indefinitely');
    expect(message.getAttachment()).toMatchSnapshot();
  });
});
