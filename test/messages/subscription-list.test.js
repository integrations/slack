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
    expect(new SubscriptionList(repositories, 'C01234').toJSON()).toMatchSnapshot();
  });

  test('works for one subscription active in a channel', async () => {
    const repositories = [
      {
        full_name: 'bkeepers/dotenv',
        html_url: 'https://github.com/bkeepers/dotenv',
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
        full_name: 'bkeepers/dotenv',
        html_url: 'https://github.com/bkeepers/dotenv',
      },
    ];
    expect(new SubscriptionList(repositories, 'D01234').toJSON()).toMatchSnapshot();
  });

  test('sorts repositories alphabetically', async () => {
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
    expect(new SubscriptionList(repositories, 'C01234').resourcesToString()).toEqual([
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
    expect(new SubscriptionList(repositories, 'C01234').resourcesToString()).toEqual([
      '<https://github.com/bkeepers/dotenv|bkeepers/dotenv>',
      '<https://github.com/integrations/slack|integrations/slack>',
      '<https://github.com/JasonEtco/todo|JasonEtco/todo>',
      '<https://github.com/wilhelmklopp/wilhelmklopp|wilhelmklopp/wilhelmklopp>',
    ]);
  });
});
