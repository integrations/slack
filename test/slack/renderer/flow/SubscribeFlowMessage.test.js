const { SubscribeFlowMessage } = require('../../../../lib/slack/renderer/flow');
const repoFixture = require('../../../fixtures/repo.json');

describe('SubscribeFlowMessage rendering', () => {
  test('works for error: no-installation', async () => {
    const message = new SubscribeFlowMessage({
      error: {
        type: 'no-installation',
        url: 'https://github.com/apps/url-to-slack-app',
      },
    });
    expect(message.getRenderedMessage()).toMatchSnapshot();
  });

  test('works for error: 404', async () => {
    const message = new SubscribeFlowMessage({
      error: {
        type: '404',
      },
      input: 'atom/atom',
    });
    expect(message.getRenderedMessage()).toMatchSnapshot();
  });

  test('works for error: invalid-link', async () => {
    const message = new SubscribeFlowMessage({
      error: {
        type: 'invalid-link',
      },
      input: 'https://amazon.com/atom/atom',
    });
    expect(message.getRenderedMessage()).toMatchSnapshot();
  });

  test('works for successfully subscribed', async () => {
    const message = new SubscribeFlowMessage({
      channelId: 'C1234',
      fromRepository: repoFixture,
    });
    expect(message.getRenderedMessage()).toMatchSnapshot();
  });

  test('works for successfully unsubscribed', async () => {
    const message = new SubscribeFlowMessage({
      channelId: 'C1234',
      fromRepository: repoFixture,
      unsubscribed: true,
    });
    expect(message.getRenderedMessage()).toMatchSnapshot();
  });
  test('works for direct messages', async () => {
    const message = new SubscribeFlowMessage({
      channelId: 'D1234',
      fromRepository: repoFixture,
    });
    expect(message.getRenderedMessage()).toMatchSnapshot();
  });

  test('works for MPIM messages', async () => {
    const message = new SubscribeFlowMessage({
      channelId: 'G1234',
      fromRepository: repoFixture,
    });
    expect(message.getRenderedMessage()).toMatchSnapshot();
  });
});
