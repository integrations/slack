const { NotFound } = require('../../../../lib/slack/renderer/flow');

describe('Not Found', () => {
  test('works', async () => {
    const message = new NotFound({
      subscribeInput: 'atom/atom',
    });
    expect(message.toJSON()).toMatchSnapshot();
  });
});
