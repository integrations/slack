const Exception = require('../../../../lib/slack/renderer/flow/exception');

describe('Exception', () => {
  test('renders generic error message', async () => {
    const exception = new Exception('error-code-123').toJSON();
    expect(exception).toHaveProperty('response_type', 'ephemeral');
    expect(exception).toHaveProperty('attachments.0.color', 'danger');
    expect(exception).toMatchSnapshot();
  });
});
