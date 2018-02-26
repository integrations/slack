const { NotFound } = require('../../../lib/messages/flow');

describe('Not Found', () => {
  test('works', async () => {
    const message = new NotFound('atom/atom');
    expect(message.toJSON()).toMatchSnapshot();
  });
});
