const SubscriptionList = require('../../lib/messages/subscription-list');
const models = require('../../lib/models');

const { Subscription } = models;

describe('SubscriptionList', () => {
  let subscriptions;
  beforeEach(() => {
    subscriptions = [
      Subscription.build({
        githubId: 1,
        type: 'repo',
      }),
      Subscription.build({
        githubId: 4,
        type: 'repo',
      }),
      Subscription.build({
        githubId: 3,
        type: 'account',
      }),
      Subscription.build({
        githubId: 2,
        type: 'account',
      }),
    ];
  });
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

    const json = new SubscriptionList(subscriptions, repositories, organizations).toJSON();
    expect(json).toMatchSnapshot();
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

    const json = new SubscriptionList(subscriptions, repositories, organizations).toJSON();
    expect(json).toMatchSnapshot();
  });

  test('works for no subscriptions active in a channel', async () => {
    const repositories = [];
    const organizations = [];
    subscriptions = [];

    const json = new SubscriptionList(subscriptions, repositories, organizations).toJSON();
    expect(json).toMatchSnapshot();
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
    expect(new SubscriptionList(subscriptions, repositories, []).repositoriesToString()).toEqual([
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

    expect(new SubscriptionList(subscriptions, repositories, []).repositoriesToString()).toEqual([
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
    expect(new SubscriptionList(subscriptions, [], organizations).accountsToString()).toEqual([
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
    expect(new SubscriptionList(subscriptions, [], organizations).accountsToString()).toEqual([
      '<https://github.com/atom|atom>',
      '<https://github.com/kubernetes|kubernetes>',
      '<https://github.com/Microsoft|Microsoft>',
    ]);
  });

  test('shows features when using /github subscribe list features', async () => {
    subscriptions = [
      Subscription.build({
        githubId: 1,
        type: 'repo',
      }),
      Subscription.build({
        githubId: 4,
        type: 'repo',
        settings: { reviews: true, comments: true },
      }),
      Subscription.build({
        githubId: 3,
        type: 'account',
        settings: { commits: 'all' },
      }),
      Subscription.build({
        githubId: 2,
        type: 'account',
      }),
    ];
    const repositories = [
      {
        id: 1,
        full_name: 'bkeepers/dotenv',
        html_url: 'https://github.com/bkeepers/dotenv',
      },
      {
        id: 4,
        full_name: 'atom/atom',
        html_url: 'https://github.com/atom/atom',
      },
    ];
    const organizations = [
      {
        id: 3,
        login: 'kubernetes',
        html_url: 'https://github.com/kubernetes',
      },
      {
        id: 2,
        login: 'atom',
        html_url: 'https://github.com/atom',
      },
    ];

    const json = new SubscriptionList(subscriptions, repositories, organizations, true).toJSON();
    expect(json).toMatchSnapshot();
  });
});
