const { Status } = require('../../../lib/slack/renderer/status');
const combinedStatus = require('../../fixtures/combined_status.json');

describe('Status rendering', () => {
  test('works', async () => {
    const singleStatus = combinedStatus.statuses[1];
    const statusAttachment = new Status(
      singleStatus,
    );
    const rendered = statusAttachment.renderAttachment();
    expect(rendered).toMatchSnapshot();
  });
  test('works for allPass', async () => {
    const rendered = Status.getAllPassAttachment(5);
    expect(rendered).toMatchSnapshot();
  });
});
