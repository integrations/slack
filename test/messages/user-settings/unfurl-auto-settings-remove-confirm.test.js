const { UnfurlAutoSettingsRemoveConfirm } = require('../../../lib/messages/user-settings');

describe('UnfurlAutoSettingsRemoveConfirm rendering', () => {
  test('works', async () => {
    expect(new UnfurlAutoSettingsRemoveConfirm('integrations/slack').getAttachment()).toMatchSnapshot();
  });
});
