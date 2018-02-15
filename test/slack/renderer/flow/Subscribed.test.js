const { Subscribed } = require('../../../../lib/slack/renderer/flow');
const repoFixture = require('../../../fixtures/repo.json');

describe('Subscribed message rendering', () => {
  test('works for successfully subscribed', async () => {
    const message = new Subscribed({
      subscription: { channelId: 'C1234' },
      repository: repoFixture,
    });
    expect(message.toJSON()).toMatchSnapshot();
  });

  test('works for successfully unsubscribed', async () => {
    const message = new Subscribed({
      subscription: { channelId: 'C1234' },
      repository: repoFixture,
      unsubscribed: true,
    });
    expect(message.toJSON()).toMatchSnapshot();
  });

  test('works for direct messages', async () => {
    const message = new Subscribed({
      subscription: { channelId: 'D1234' },
      repository: repoFixture,
    });
    expect(message.toJSON()).toMatchSnapshot();
  });

  test('works for MPIM messages', async () => {
    const message = new Subscribed({
      subscription: { channelId: 'G1234' },
      repository: repoFixture,
    });
    expect(message.toJSON()).toMatchSnapshot();
  });
});
