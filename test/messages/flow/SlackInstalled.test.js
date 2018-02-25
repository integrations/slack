const { SlackInstalled } = require('../../../lib/messages/flow');

describe('SlackInstalled', () => {
  test('works', async () => {
    const message = new SlackInstalled();
    expect(message.toJSON()).toMatchSnapshot();
  });
});
