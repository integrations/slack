const { Public } = require('../../lib/messages/public');

const publicEvent = require('../fixtures/webhooks/public.json');

describe('Public rendering', () => {
  test('works', async () => {
    const publicEventMessage = new Public({
      publicEvent,
    });
    const rendered = publicEventMessage.toJSON();
    expect(rendered).toMatchSnapshot();
  });
});
