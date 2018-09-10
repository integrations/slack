// contents.json combined with params from github-url?

const { Blob } = require('../../lib/messages/blob');
const repository = require('../fixtures/repo.json');
const contents = require('../fixtures/contents.json');
const binaryFileContents = require('../fixtures/binary-file-contents.json');

describe('Blob rendering', () => {
  test('works without line numbers', async () => {
    const blobMessage = new Blob({
      repository,
      blob: contents,
    });
    const rendered = blobMessage.getRenderedMessage();
    expect(rendered).toMatchSnapshot();
  });

  test('works with a single line', async () => {
    const blobMessage = new Blob({
      repository,
      blob: contents,
      line: '122',
    });
    const rendered = blobMessage.getRenderedMessage();
    expect(rendered).toMatchSnapshot();
  });

  test('works with a range of line numbers', async () => {
    const blobMessage = new Blob({
      repository,
      blob: contents,
      line: ['122', '129'],
    });
    const rendered = blobMessage.getRenderedMessage();
    expect(rendered).toMatchSnapshot();
  });

  test('works for condensed unfurls', async () => {
    const blobMessage = new Blob({
      repository,
      blob: contents,
      line: ['122', '129'],
      unfurlType: 'condensed',
    });
    const rendered = blobMessage.getRenderedMessage();
    expect(rendered).toMatchSnapshot();
  });

  test('doesn\'t unfurl binary files', async () => {
    const blobMessage = new Blob({
      repository,
      blob: binaryFileContents,
    });

    expect(() => {
      blobMessage.getRenderedMessage();
    }).toThrow(/File is binary/);
  });
});
