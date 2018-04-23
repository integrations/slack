const { Ref } = require('../../lib/messages/ref');

const branchDeleted = require('../fixtures/webhooks/branch_deleted.json');
const tagCreated = require('../fixtures/webhooks/tag_created.json');

describe('Ref rendering', () => {
  test('works for branches', async () => {
    const refMessage = new Ref({
      event: 'delete',
      ...branchDeleted,
    });
    const rendered = refMessage.toJSON();
    expect(rendered).toMatchSnapshot();
  });

  test('works for tags', async () => {
    const refMessage = new Ref({
      event: 'create',
      ...tagCreated,
    });
    const rendered = refMessage.toJSON();
    expect(rendered).toMatchSnapshot();
  });
});
