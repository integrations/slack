const { GollumMessage } = require('../../lib/messages/gollum');

const gollum = require('../fixtures/webhooks/gollum.json');

describe('GollumMessage rendering', () => {
  test('works', async () => {
    const gollumMessage = new GollumMessage({
      gollum,
    });
    const rendered = gollumMessage.getRenderedMessage();
    expect(rendered).toMatchSnapshot();
  });
});
