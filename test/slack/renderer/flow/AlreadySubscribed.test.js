const { AlreadySubscribed } = require('../../../../lib/slack/renderer/flow');

describe('AlreadySubscribed message rendering', () => {
  test('works', async () => {
    const message = new AlreadySubscribed('atom/atom');
    expect(message.toJSON()).toMatchSnapshot();
  });
});
