const { AlreadySubscribed } = require('../../../lib/messages/flow');

describe('AlreadySubscribed message rendering', () => {
  test('works', async () => {
    const message = new AlreadySubscribed('atom/atom');
    expect(message.toJSON()).toMatchSnapshot();
  });
});
