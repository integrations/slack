const ErrorMessage = require('../../../lib/messages/flow/error-message');

describe('ErrorMessage', () => {
  test('is ephemeral and has danger color', async () => {
    const errorMessage = new ErrorMessage().getErrorMessage();
    expect(errorMessage).toHaveProperty('response_type', 'ephemeral');
    expect(errorMessage).toHaveProperty('attachments.0.color', 'danger');
  });
});
