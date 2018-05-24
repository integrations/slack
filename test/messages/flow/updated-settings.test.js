const { UpdatedSettings } = require('../../../lib/messages/flow');
const { Subscription } = require('../../models');
const repository = require('../../fixtures/repo.json');

describe('UpdatedSettings message', () => {
  test('default settings', async () => {
    const subscription = new Subscription({
      channelId: 'C001',
    });

    const message = new UpdatedSettings({ subscription, resource: repository });
    expect(message.toJSON()).toMatchSnapshot();
  });

  test('sub settings', async () => {
    const subscription = new Subscription({
      channelId: 'C001',
      settings: ['commits:all'],
    });

    const message = new UpdatedSettings({ subscription, resource: repository });
    expect(message.toJSON().attachments[0].text).toMatch(/commits:all/);
    expect(message.toJSON()).toMatchSnapshot();
  });

  test('hides overwritten settings', async () => {
    const subscription = new Subscription({
      channelId: 'C001',
      settings: { pulls: false },
    });

    const message = new UpdatedSettings({ subscription, resource: repository });
    expect(message.toJSON().attachments[0].text).not.toMatch(/pulls/);
    expect(message.toJSON()).toMatchSnapshot();
  });
});
