const RepositoryDeleted = require('../../lib/messages/repository-deleted');

const repositoryDeletedEvent = require('../fixtures/webhooks/repository.deleted.json');

describe('Repository deleted event rendering', () => {
  test('works', async () => {
    expect(new RepositoryDeleted(repositoryDeletedEvent).toJSON()).toMatchSnapshot();
  });
});
