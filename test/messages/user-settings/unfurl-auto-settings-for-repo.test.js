const { UnfurlAutoSettingsForRepo } = require('../../../lib/messages/user-settings');

describe('UnfurlAutoSettingsForRepo rendering', () => {
  test('works when repo is unfurled in all channels', async () => {
    const actionValue = '12345|integrations/snappydoo';
    const slackUser = {
      settings: {
        unfurlPrivateResources: {
          12345: ['all', 'C1234'],
        },
      },
    };
    const message = new UnfurlAutoSettingsForRepo(actionValue, slackUser);
    expect(message.getAttachment()).toMatchSnapshot();
  });

  test('works when repo is unfurled only in some channels', async () => {
    const actionValue = '12345|integrations/snappydoo';
    const slackUser = {
      settings: {
        unfurlPrivateResources: {
          12345: ['C4321', 'C1234'],
        },
      },
    };
    const message = new UnfurlAutoSettingsForRepo(actionValue, slackUser);
    expect(message.getAttachment()).toMatchSnapshot();
  });
});
