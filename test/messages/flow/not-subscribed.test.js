const { NotSubscribed } = require('../../../lib/messages/flow');

describe('NotSubscribed message rendering', () => {
  test('works', async () => {
    const message = new NotSubscribed('atom/atom');
    expect(message.toJSON()).toMatchSnapshot();
  });
});
