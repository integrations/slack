const { Help } = require('../../../lib/messages/flow');

describe('Help rendering', () => {
  test('works', async () => {
    const message = new Help('/github');
    expect(message.toJSON()).toMatchSnapshot();
  });

  test('works when passing additional attachments', async () => {
    const additionalAttachments = [{
      title: 'Subscribed to these accounts',
      text: 'integrations/slack',
    }];
    const message = new Help('/github', 'subscribe', additionalAttachments);
    expect(message.toJSON()).toMatchSnapshot();
  });
});
