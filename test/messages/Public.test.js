const { Public } = require('../../lib/messages/public');

const publicEvent = require('../fixtures/webhooks/public.json');

describe('Public rendering', () => {
  test('works', async () => {
    expect(new Public(publicEvent).toJSON()).toMatchSnapshot();
  });
});
