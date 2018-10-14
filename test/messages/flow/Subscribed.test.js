const { Subscribed } = require('../../../lib/messages/flow');
const repoFixture = require('../../fixtures/repo.json');

describe('Subscribed message rendering', () => {
  test('works for successfully subscribed', async () => {
    const message = new Subscribed({
      fromRepository: repoFixture,
    });
    expect(message.toJSON()).toMatchSnapshot();
  });

  test('works for successfully unsubscribed', async () => {
    const message = new Subscribed({
      fromRepository: repoFixture,
      unsubscribed: true,
    });
    expect(message.toJSON()).toMatchSnapshot();
  });
});
