const SubscriptionList = require('../../lib/messages/subscription-list');

describe('SubscriptionList', () => {
  test('works for multiple subscriptions active in a channel', async () => {
    const repositories = [
      {
        full_name: 'bkeepers/dotenv',
        html_url: 'https://github.com/bkeepers/dotenv',
      },
      {
        full_name: 'atom/atom',
        html_url: 'https://github.com/atom/atom',
      },
    ];
    const organizations = [
      {
        login: 'kubernetes',
        html_url: 'https://github.com/kubernetes',
      },
      {
        login: 'atom',
        html_url: 'https://github.com/atom',
      },
    ];
    expect(new SubscriptionList(repositories, organizations, 'C01234').toJSON()).toMatchSnapshot();
  });

  test('works for one subscription active in a channel', async () => {
    const repositories = [
      {
        full_name: 'bkeepers/dotenv',
        html_url: 'https://github.com/bkeepers/dotenv',
      },
    ];
    const organizations = [
      {
        login: 'kubernetes',
        html_url: 'https://github.com/kubernetes',
      },
    ];
    expect(new SubscriptionList(repositories, organizations, 'C01234').toJSON()).toMatchSnapshot();
  });

  test('works for no subscriptions active in a channel', async () => {
    const repositories = [];
    const organizations = [];
    expect(new SubscriptionList(repositories, organizations, 'C01234').toJSON()).toMatchSnapshot();
  });

  test('works for one subscription active in a direct message', async () => {
    const repositories = [
      {
        full_name: 'bkeepers/dotenv',
        html_url: 'https://github.com/bkeepers/dotenv',
      },
    ];
    const organizations = [
      {
        login: 'kubernetes',
        html_url: 'https://github.com/kubernetes',
      },
    ];
    expect(new SubscriptionList(repositories, organizations, 'D01234').toJSON()).toMatchSnapshot();
  });

  test('sorts subscriptions alphabetically', async () => {
    const repositories = [
      {
        full_name: 'wilhelmklopp/wilhelmklopp',
        html_url: 'https://github.com/wilhelmklopp/wilhelmklopp',
      },
      {
        full_name: 'bkeepers/dotenv',
        html_url: 'https://github.com/bkeepers/dotenv',
      },
      {
        full_name: 'integrations/slack',
        html_url: 'https://github.com/integrations/slack',
      },
    ];
    expect(new SubscriptionList(repositories, [], 'C01234').repositoriesToString()).toEqual([
      '<https://github.com/bkeepers/dotenv|bkeepers/dotenv>',
      '<https://github.com/integrations/slack|integrations/slack>',
      '<https://github.com/wilhelmklopp/wilhelmklopp|wilhelmklopp/wilhelmklopp>',
    ]);
  });

  test('sorts repositories alphabetically including different cases', async () => {
    const repositories = [
      {
        full_name: 'wilhelmklopp/wilhelmklopp',
        html_url: 'https://github.com/wilhelmklopp/wilhelmklopp',
      },
      {
        full_name: 'bkeepers/dotenv',
        html_url: 'https://github.com/bkeepers/dotenv',
      },
      {
        full_name: 'integrations/slack',
        html_url: 'https://github.com/integrations/slack',
      },
      {
        full_name: 'JasonEtco/todo',
        html_url: 'https://github.com/JasonEtco/todo',
      },
    ];
    expect(new SubscriptionList(repositories, [], 'C01234').repositoriesToString()).toEqual([
      '<https://github.com/bkeepers/dotenv|bkeepers/dotenv>',
      '<https://github.com/integrations/slack|integrations/slack>',
      '<https://github.com/JasonEtco/todo|JasonEtco/todo>',
      '<https://github.com/wilhelmklopp/wilhelmklopp|wilhelmklopp/wilhelmklopp>',
    ]);
  });

  test('sorts accounts alphabetically', async () => {
    const organizations = [
      {
        login: 'kubernetes',
        html_url: 'https://github.com/kubernetes',
      },
      {
        login: 'atom',
        html_url: 'https://github.com/atom',
      },
    ];
    expect(new SubscriptionList([], organizations, 'C01234').accountsToString()).toEqual([
      '<https://github.com/atom|atom>',
      '<https://github.com/kubernetes|kubernetes>',
    ]);
  });

  test('sorts accounts alphabetically including different cases', async () => {
    const organizations = [
      {
        login: 'Microsoft',
        html_url: 'https://github.com/Microsoft',
      },
      {
        login: 'kubernetes',
        html_url: 'https://github.com/kubernetes',
      },
      {
        login: 'atom',
        html_url: 'https://github.com/atom',
      },
    ];
    expect(new SubscriptionList([], organizations, 'C01234').accountsToString()).toEqual([
      '<https://github.com/atom|atom>',
      '<https://github.com/kubernetes|kubernetes>',
      '<https://github.com/Microsoft|Microsoft>',
    ]);
  });
});
