const { Review } = require('../../lib/messages/review');

const reviewApproved = require('../fixtures/webhooks/pull_request_review/approved.json');
const reviewCommented = require('../fixtures/webhooks/pull_request_review/commented.json');
const reviewChangesRequested = require('../fixtures/webhooks/pull_request_review/changes_requested.json');

describe('Review rendering', () => {
  test('works for commented', async () => {
    const reviewMessage = new Review({
      ...reviewCommented,
    });
    const rendered = reviewMessage.toJSON();
    expect(rendered).toMatchSnapshot();
  });

  test('works for approved', async () => {
    const reviewMessage = new Review({
      ...reviewApproved,
    });
    const rendered = reviewMessage.toJSON();
    expect(rendered).toMatchSnapshot();
  });

  test('works for changes requested', async () => {
    const reviewMessage = new Review({
      ...reviewChangesRequested,
    });
    const rendered = reviewMessage.toJSON();
    expect(rendered).toMatchSnapshot();
  });
});
