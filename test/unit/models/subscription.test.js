const { Subscription } = require('.');

describe('router', () => {
  const channel = 'C0001';

  describe('subscribe', () => {
    test('add subscription for resource', async () => {
      const resource = 1;
      await Subscription.subscribe(resource, channel);
      const channels = await Subscription.lookup(resource);
      expect(channels).toEqual([channel]);
    });

    test('does not duplicate subscriptions', async () => {
      const resource = 1;
      await Subscription.subscribe(resource, channel);
      await Subscription.subscribe(resource, channel);
      const channels = await Subscription.lookup(resource);
      expect(channels).toEqual([channel]);
    });
  });

  describe('unsubscribe', () => {
    test('removes subscriptions for resource', async () => {
      const resource = 1;
      await Subscription.subscribe(resource, channel);
      await Subscription.unsubscribe(resource, channel);
      expect(await Subscription.lookup(resource)).toEqual([]);
    });
  });
});
