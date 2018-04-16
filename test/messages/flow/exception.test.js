const Exception = require('../../../lib/messages/flow/exception');

describe('Exception', () => {
  test('works', async () => {
    const exception = new Exception('error-code-123', {
      team_id: 'T01234',
      user_id: 'U01234',
      channel_id: 'C01234',
    }).toJSON();
    expect(exception).toMatchSnapshot();
  });
});
