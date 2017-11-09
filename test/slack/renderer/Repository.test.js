const { Repository } = require('../../../lib/slack/renderer/repository');
const repoFixture = require('../../fixtures/repo.json');

describe('Repository rendering', () => {
  test('works', async () => {
    const repositoryMessage = new Repository({
      repository: repoFixture,
    });
    expect(repositoryMessage.getRenderedMessage()).toMatchSnapshot();
  });
});
