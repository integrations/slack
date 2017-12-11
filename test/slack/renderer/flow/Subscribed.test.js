const { Subscribed } = require('../../../../lib/slack/renderer/flow');
const repoFixture = require('../../../fixtures/repo.json');

describe('Subscribed message rendering', () => {
//   test('works for error: no-installation', async () => {
//     const message = new SubscribeFlowMessage({
//       error: {
//         type: 'no-installation',
//         url: 'https://github.com/apps/url-to-slack-app',
//       },
//     });
//     expect(message.getRenderedMessage()).toMatchSnapshot();
//   });

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
});
