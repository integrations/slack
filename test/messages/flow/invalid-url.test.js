const { InvalidUrl } = require('../../../lib/messages/flow');

describe('InvalidUrl message rendering', () => {
  test('works', async () => {
    const message = new InvalidUrl('https://amazon.com/atom/atom');
    expect(message.toJSON()).toMatchSnapshot();
  });
});
