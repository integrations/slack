const Router = require('../lib/router');

describe('router', () => {
  let router;

  beforeEach(async () => {
    router = new Router();
    await router.reset();
  });

  const channel = 'C0001';

  describe('subscribe', () => {
    test('add subscription for resource', async () => {
      const resource = 1;
      await router.subscribe(resource, channel);
      const channels = await router.lookup(resource);
      expect(channels).toEqual([channel]);
    });

    test('does not duplicate subscriptions', async () => {
      const resource = 1;
      await router.subscribe(resource, channel);
      await router.subscribe(resource, channel);
      const channels = await router.lookup(resource);
      expect(channels).toEqual([channel]);
    });
  });

  describe('unsubscribe', () => {
    test('removes subscriptions for resource', async () => {
      const resource = 1;
      await router.subscribe(resource, channel);
      await router.unsubscribe(resource, channel);
      expect(await router.lookup(resource)).toEqual([]);
    });
  });
});
