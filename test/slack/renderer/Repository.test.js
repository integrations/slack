const moment = require('moment');
const { Repository } = require('../../../lib/slack/renderer/repository');
const repoFixture = require('../../fixtures/repo.json');

repoFixture.updated_at = moment().subtract(2, 'months');

describe('Repository rendering', () => {
  test('works for full unfurls', async () => {
    const repositoryMessage = new Repository({
      repository: repoFixture,
      unfurlType: 'full',
    });
    expect(repositoryMessage.getRenderedMessage()).toMatchSnapshot();
  });

  test('works for condensed unfurls', async () => {
    const repositoryMessage = new Repository({
      repository: repoFixture,
      unfurlType: 'condensed',
    });
    expect(repositoryMessage.getRenderedMessage()).toMatchSnapshot();
  });
});
