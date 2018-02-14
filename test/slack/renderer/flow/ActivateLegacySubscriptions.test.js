const { ActivateLegacySubscriptions } = require('../../../../lib/slack/renderer/flow');

describe('AlreadySubscribed message rendering', () => {
  test('works for multiple configurations and authors in a channel', async () => {
    const subscriptions = [
      {
        authorSlackId: 'U12345',
        repoFullName: 'kubernetes/kubernetes',
      },
      {
        authorSlackId: 'U12345',
        repoFullName: 'facebook/react',
      },
      {
        authorSlackId: 'U54321',
        repoFullName: 'django/django',
      },
      {
        authorSlackId: 'U54321',
        repoFullName: 'microsoft/typescript',
      },
    ];
    const message = new ActivateLegacySubscriptions(subscriptions);
    expect(message.toJSON()).toMatchSnapshot();
  });
  test('works for one configuration in a channel', async () => {
    const subscriptions = [{
      authorSlackId: 'U12345',
      repoFullName: 'atom/atom',
    }];
    const message = new ActivateLegacySubscriptions(subscriptions);
    expect(message.toJSON()).toMatchSnapshot();
  });
});
