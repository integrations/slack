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
    const subscribedAccounts = [
      {
        login: 'kubernetes',
      },
      {
        login: 'django',
      },
      {
        login: 'microsoft',
      },
    ];
    const message = new ReEnableMultipleSubscriptions(
      subscribedRepositories,
      subscribedAccounts,
      'U12345',
      'disconnected their GitHub account',
    );
    expect(message.getAttachment()).toMatchSnapshot();
  });

  test('works with empty repository subscriptions', async () => {
    const subscribedRepositories = [];
    const subscribedAccounts = [
      {
        login: 'kubernetes',
      },
      {
        login: 'django',
      },
      {
        login: 'microsoft',
      },
    ];
    const message = new ReEnableMultipleSubscriptions(
      subscribedRepositories,
      subscribedAccounts,
      'U12345',
      'disconnected their GitHub account',
    );
    expect(message.getAttachment()).toMatchSnapshot();
  });

  test('works with empty account subscriptions', async () => {
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
    const subscribedAccounts = [];
    const message = new ReEnableMultipleSubscriptions(
      subscribedRepositories,
      subscribedAccounts,
      'U12345',
      'disconnected their GitHub account',
    );
    expect(message.getAttachment()).toMatchSnapshot();
  });
});
