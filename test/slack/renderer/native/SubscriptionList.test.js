const { SubscriptionList } = require('../../../../lib/slack/renderer/native');

describe('SubscriptionList', () => {
  test('works for multiple subscriptions active in a channel', async () => {
    const repositories = [
      {
        html_url: 'https://github.com/bkeepers/dotenv',
        full_name: 'bkeepers/dotenv',
      },
      {
        html_url: 'https://github.com/atom/atom',
        full_name: 'atom/atom',
      },
    ];
    expect(new SubscriptionList(repositories, 'C01234').toJSON()).toMatchSnapshot();
  });

  test('works for one subscription active in a channel', async () => {
    const repositories = [
      {
        html_url: 'https://github.com/bkeepers/dotenv',
        full_name: 'bkeepers/dotenv',
      },
    ];
    expect(new SubscriptionList(repositories, 'C01234').toJSON()).toMatchSnapshot();
  });

  test('works for no subscriptions active in a channel', async () => {
    const repositories = [];
    expect(new SubscriptionList(repositories, 'C01234').toJSON()).toMatchSnapshot();
  });

  test('works for one subscription active in a direct message', async () => {
    const repositories = [
      {
        html_url: 'https://github.com/bkeepers/dotenv',
        full_name: 'bkeepers/dotenv',
      },
    ];
    expect(new SubscriptionList(repositories, 'D01234').toJSON()).toMatchSnapshot();
  });
});
