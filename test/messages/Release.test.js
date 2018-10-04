const { Release } = require('../../lib/messages/release');
const repository = require('../fixtures/repo.json');
const release = require('../fixtures/release.json');

describe('Release rendering', () => {
  test('works', async () => {
    const releaseMessage = new Release({
      eventType: 'release.published',
      release,
      repository,
    });
    const rendered = releaseMessage.getRenderedMessage();
    expect(rendered).toMatchSnapshot();
  });
  test('works for empty release name', async () => {
    const r = { ...release };
    r.name = '';
    const releaseMessage = new Release({
      eventType: 'release.published',
      release: r,
      repository,
    });
    const rendered = releaseMessage.getRenderedMessage();
    expect(rendered).toMatchSnapshot();
  });
  test('works for null release name', async () => {
    const r = { ...release };
    r.name = null;
    const releaseMessage = new Release({
      eventType: 'release.published',
      release: r,
      repository,
    });
    const rendered = releaseMessage.getRenderedMessage();
    expect(rendered).toMatchSnapshot();
  });
});
