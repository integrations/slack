const NoSubscriptionsError = require('../../../lib/messages/create/no-subscriptions-error');

describe('NoSubscriptionsError message rendering', () => {
  test('works', async () => {
    const message = new NoSubscriptionsError();
    expect(message.getAttachment()).toMatchSnapshot();
  });
});
