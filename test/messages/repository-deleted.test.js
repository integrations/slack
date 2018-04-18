const moment = require('moment');

const RepositoryDeleted = require('../../lib/messages/repository-deleted');

const repositoryDeletedEvent = require('../fixtures/webhooks/repository.deleted.json');

repositoryDeletedEvent.repository.updated_at = moment().subtract(2, 'months');

describe('Repository deleted event rendering', () => {
  test('works', async () => {
    expect(new RepositoryDeleted(repositoryDeletedEvent).toJSON()).toMatchSnapshot();
  });
});
