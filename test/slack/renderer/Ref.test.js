const { Ref } = require('../../../lib/slack/renderer/ref');

const branchDeleted = require('../../fixtures/webhooks/branch_deleted.json');
const tagCreated = require('../../fixtures/webhooks/tag_created.json');

describe('Ref rendering', () => {
  test('works for branches', async () => {
    const refMessage = new Ref({
      eventType: 'delete',
      ref: branchDeleted.ref,
      refType: branchDeleted.ref_type,
      sender: branchDeleted.sender,
      repository: branchDeleted.repository,
    });
    const rendered = refMessage.toJSON();
    expect(rendered).toMatchSnapshot();
  });

  test('works for tags', async () => {
    const refMessage = new Ref({
      eventType: 'create',
      ref: tagCreated.ref,
      refType: tagCreated.ref_type,
      sender: tagCreated.sender,
      repository: tagCreated.repository,
    });
    const rendered = refMessage.toJSON();
    expect(rendered).toMatchSnapshot();
  });
});
