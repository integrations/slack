const { SlackInstalled } = require('../../../../lib/slack/renderer/flow');

describe('SlackInstalled', () => {
  test('works', async () => {
    const message = new SlackInstalled();
    expect(message.toJSON()).toMatchSnapshot();
  });
});
