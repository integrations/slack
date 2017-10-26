const { Status } = require('./../../lib/slack/renderer/Status');
const combinedStatus = require('./../fixtures/combined_status.json');

describe('Status rendering', () => {
  test('works', async () => {
    const singleStatus = combinedStatus.statuses[1];
    const statusAttachment = new Status(
      singleStatus,
    );
    const rendered = statusAttachment.renderAttachment();
    expect(rendered).toMatchSnapshot();
  });
});
