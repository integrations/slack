const { Subscribed } = require('../../../lib/messages/flow');
const repoFixture = require('../../fixtures/repo.json');

describe('Subscribed message rendering', () => {
  test('works for successfully subscribed', async () => {
    const message = new Subscribed({
      channelId: 'C1234',
      fromRepository: repoFixture,
    });
    expect(message.toJSON()).toMatchSnapshot();
  });

  test('works for successfully unsubscribed', async () => {
    const message = new Subscribed({
      channelId: 'C1234',
      fromRepository: repoFixture,
      unsubscribed: true,
    });
    expect(message.toJSON()).toMatchSnapshot();
  });

  test('works for direct messages', async () => {
    const message = new Subscribed({
      channelId: 'D1234',
      fromRepository: repoFixture,
    });
    expect(message.toJSON()).toMatchSnapshot();
  });

  test('works for MPIM messages', async () => {
    const message = new Subscribed({
      channelId: 'G1234',
      fromRepository: repoFixture,
    });
    expect(message.toJSON()).toMatchSnapshot();
  });
});
