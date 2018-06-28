const ReEnableMultipleSubscriptions = require('../../../lib/messages/flow/re-enable-multiple-subscriptions');

describe('ReEnableMultipleSubscriptions message rendering', () => {
  test('works', async () => {
    const subscribedRepositories = [
      {
        full_name: 'kubernetes/kubernetes',
      },
      {
        full_name: 'facebook/react',
      },
      {
        full_name: 'django/django',
      },
      {
        full_name: 'microsoft/typescript',
      },
    ];
    const message = new ReEnableMultipleSubscriptions(
      subscribedRepositories,
      'U12345',
      'disconnected their GitHub account',
    );
    expect(message.getAttachment()).toMatchSnapshot();
  });
});
