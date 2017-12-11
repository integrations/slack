const { InvalidUrl } = require('../../../../lib/slack/renderer/flow');

describe('InvalidUrl message rendering', () => {
  test('works', async () => {
    const message = new InvalidUrl({
      subscribeInput: 'https://amazon.com/atom/atom',
    });
    expect(message.toJSON()).toMatchSnapshot();
  });
});
