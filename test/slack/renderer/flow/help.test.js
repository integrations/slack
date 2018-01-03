const { Help } = require('../../../../lib/slack/renderer/flow');

describe('Help rendering', () => {
  test('works', async () => {
    const message = new Help('/github');
    expect(message.toJSON()).toMatchSnapshot();
  });
});
