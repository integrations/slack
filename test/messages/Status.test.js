const { Status } = require('../../lib/messages/status');
const combinedStatus = require('../fixtures/combined_status.json');

describe('Status rendering', () => {
  test('works', async () => {
    const singleStatus = combinedStatus.statuses[1];
    const statusAttachment = new Status(singleStatus);
    const rendered = statusAttachment.renderAttachment();
    expect(rendered).toMatchSnapshot();
  });
  test('works for all checks pass', async () => {
    const rendered = Status.getChecksPassAttachment(5, 5);
    expect(rendered).toMatchSnapshot();
  });

  test('works for some checks pass', async () => {
    const rendered = Status.getChecksPassAttachment(4, 5);
    expect(rendered).toMatchSnapshot();
  });

  test('works when no checks pass', async () => {
    const rendered = Status.getChecksPassAttachment(0, 5);
    expect(rendered).toMatchSnapshot();
  });
});
