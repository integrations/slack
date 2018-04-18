const AutoUnfurlSettingConfirm = require('../../../lib/messages/unfurls/auto-unfurl-setting-confirm');

describe('AutoUnfurlSettingConfirm message rendering', () => {
  test('works for any channel', async () => {
    const message = new AutoUnfurlSettingConfirm('integrations/snappydoo', true);
    expect(message.getAttachment()).toMatchSnapshot();
  });
  test('works for one channel', async () => {
    const message = new AutoUnfurlSettingConfirm('integrations/snappydoo', false);
    expect(message.getAttachment()).toMatchSnapshot();
  });
});
