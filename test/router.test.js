const router = require('../lib/router')

describe('router', () => {
  beforeEach(async () => {
    await router.reset()
  })

  const channel = 'C0001'
  const owner = 1
  const repo = 2

  describe('subscribe', () => {
    test('add subscription for resource', async () => {
      const resource = 'https://api.github.com/repos/foo/bar'
      await router.subscribe(resource, channel)
      const channels = await router.lookup(resource)
      expect(channels).toEqual([channel])
    })
  });

  describe('unsubscribe', () => {
    test('removes subscriptions for resource', async () => {
      const resource = 'https://api.github.com/repos/foo/bar'
      await router.subscribe(resource, channel)
      await router.unsubscribe(resource, channel)
      expect(await router.lookup(resource)).toEqual([])
    })
  });

});
