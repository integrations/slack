// contents.json combined with params from github-url?

const { Blob } = require('../../../lib/slack/renderer/blob');
const contents = require('../../fixtures/contents.json');

describe('Blob rendering', () => {
  test('works without line numbers', async () => {
    const blobMessage = new Blob({
      blob: contents,
    });
    const rendered = blobMessage.getRenderedMessage();
    expect(rendered).toMatchSnapshot();
  });

  test('works with a single line', async () => {
    const blobMessage = new Blob({
      blob: contents,
      line: '122',
    });
    const rendered = blobMessage.getRenderedMessage();
    expect(rendered).toMatchSnapshot();
  });

  test('works with a range of line numbers', async () => {
    const blobMessage = new Blob({
      blob: contents,
      line: ['122', '129'],
    });
    const rendered = blobMessage.getRenderedMessage();
    expect(rendered).toMatchSnapshot();
  });
});
