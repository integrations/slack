const { InvalidSubscribeArg } = require('../../../lib/messages/flow');

describe('Invalid Argument', () => {
  test('works', async () => {
    const message = new InvalidSubscribeArg('label;foo');
    expect(message.toJSON()).toMatchSnapshot();
  });
});
