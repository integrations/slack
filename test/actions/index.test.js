const actions = require('../../lib/actions');

describe('Action prompt object', () => {
  test('createIssue', async () => {
    const res = {
      send: result => result,
      locals: {
        slackWorkspace: {
          client: {
            dialog: {
              open: () => true,
            },
          },
        },
      },
    };

    const req = {
      body: {
        trigger_id: 1234,
        message: {
          text: 'Test message',
        },
      },
    };
    const result = await actions.createIssue(req, res);

    expect(result).toMatchSnapshot();
  });
});
