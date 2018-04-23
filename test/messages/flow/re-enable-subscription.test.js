const { ReEnableSubscription } = require('../../../lib/messages/flow');

describe('ReEnableSubscription message rendering', () => {
  test('works', () => {
    const repository = {
      full_name: 'atom/atom',
      html_url: 'https://github.com/atom/atom',
    };
    const message = new ReEnableSubscription(repository, 'U012345');
    expect(message.toJSON()).toMatchSnapshot();
  });
});
