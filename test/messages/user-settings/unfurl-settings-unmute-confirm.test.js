const { UnfurlSettingsUnmuteConfirm } = require('../../../lib/messages/user-settings');

describe('UnfurlSettingsUnmuteConfirm rendering', () => {
  test('works', async () => {
    expect(new UnfurlSettingsUnmuteConfirm().getAttachment()).toMatchSnapshot();
  });
});
