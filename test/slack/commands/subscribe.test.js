const subscribe = require('../../../lib/slack/commands/subscribe');

describe('subscribe', () => {
  let router;
  let resolver;
  let repository;

  beforeEach(() => {
    repository = { url: 'https://api.github.com/repos/foo/bar' };

    router = {
      subscribe: jest.fn(),
    };

    resolver = {
      resource: jest.fn().mockReturnValue(repository),
    };
  });

  describe('with full repository url', () => {
    test('adds subscription for ', async () => {
      const command = {
        name: '/github',
        args: 'subscribe https://github.com/foo/bar',
        context: {
          channel_id: 'C0001',
        },
      };

      await subscribe(command, { router, resolver });
      expect(resolver.resource).toHaveBeenCalledWith('https://github.com/foo/bar')
      expect(router.subscribe).toHaveBeenCalledWith(repository.url, 'C0001');
    });
  });
});
