// contents.json combined with params from github-url?

const { Comment } = require('../../../lib/slack/renderer/comment');
const repository = require('../../fixtures/repo.json');
const comment = require('../../fixtures/comment.json');
const issue = require('../../fixtures/issue.json');

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
});
