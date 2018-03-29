const { Help } = require('../../../lib/messages/flow');

describe('Help rendering', () => {
  test('works', async () => {
    const message = new Help('/github');
    expect(message.toJSON()).toMatchSnapshot();
  });
});
