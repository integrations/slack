const { Repository } = require('../../../lib/slack/renderer/repository');
const repoFixture = require('../../fixtures/repo.json');
const { messageBuilderSerializer } = require('./messageBuilderSerializer');

describe('Repository rendering', () => {
  test('works', async () => {
    const repositoryMessage = new Repository({
      repository: repoFixture,
    });
    expect.addSnapshotSerializer(messageBuilderSerializer);
    expect(repositoryMessage.getRenderedMessage()).toMatchSnapshot();
  });
});
