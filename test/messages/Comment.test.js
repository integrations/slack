// contents.json combined with params from github-url?

const { Comment } = require('../../lib/messages/comment');
const repository = require('../fixtures/repo.json');
const comment = require('../fixtures/comment.json');
const issue = require('../fixtures/issue.json');

describe('Comment rendering', () => {
  test('works for full unfurls', async () => {
    const blobMessage = new Comment({
      comment,
      repository,
      issue,
      unfurlType: 'full',
    });
    const rendered = blobMessage.getRenderedMessage();
    expect(rendered).toMatchSnapshot();
  });

  test('works for condensed unfurls', async () => {
    const blobMessage = new Comment({
      comment,
      repository,
      issue,
      unfurlType: 'condensed',
    });
    const rendered = blobMessage.getRenderedMessage();
    expect(rendered).toMatchSnapshot();
  });

  test('converts HTML body to mrkdwn', () => {
    const message = new Comment({
      comment: Object.assign({
        body_html: '<strong>Hello</strong> <em>cruel</em> <a href="http://example.com">world</a>',
      }, comment),
      repository,
      issue,
      unfurlType: 'full',
    });

    expect(message.getRenderedMessage().text).toEqual('*Hello* _cruel_ <http://example.com|world>');
  });

  test('extracts image from body_html', () => {
    const message = new Comment({
      comment: Object.assign({
        body_html: '<p>Hello world!</p><p><img src="https://media.giphy.com/media/5xtDarEbygs3Pu7p3jO/giphy.gif"></p>',
      }, comment),
      repository,
      issue,
      unfurlType: 'full',
    });

    expect(message.getRenderedMessage()).toMatchSnapshot();
  });
});
