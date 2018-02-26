const { Message } = require('../../lib/messages');

describe('Message rendering', () => {
  test('works for messages with footers', async () => {
    const message = new Message({ footer: 'Hello Footer' });
    expect(message.getBaseMessage()).toHaveProperty('footer');
    expect(message.getBaseMessage()).toHaveProperty('footer_icon');
    expect(message.getBaseMessage()).toMatchSnapshot();
  });

  test('works for messages without footer', async () => {
    const message = new Message({ });
    expect(message.getBaseMessage()).not.toHaveProperty('footer');
    expect(message.getBaseMessage()).not.toHaveProperty('footer_icon');
    expect(message.getBaseMessage()).toMatchSnapshot();
  });

  test('works for fields', async () => {
    const fields = [
      {
        title: 'Milestone',
        value: '1',
      },
      {
        title: 'Lables',
        value: 'bug, wip',
      },
    ];
    expect(Message.cleanFields(fields, 1)).toEqual([
      {
        title: 'Milestone',
        value: '1',
        short: true,
      },
    ]);
  });

  test('works for empty fields', async () => {
    const fields = [
      {
        title: 'Milestone',
        value: null,
      },
      {
        title: 'Lables',
        value: 'bug, wip',
      },
    ];
    expect(Message.cleanFields(fields, 1, false)).toEqual([
      {
        title: 'Lables',
        value: 'bug, wip',
      },
    ]);
  });

  test('works for fields without the short key', async () => {
    const fields = [
      {
        title: 'Milestone',
        value: 'very large milestone name',
      },
      {
        title: 'Lables',
        value: 'bug, wip',
      },
    ];
    expect(Message.cleanFields(fields, Infinity, false)).toEqual([
      {
        title: 'Milestone',
        value: 'very large milestone name',
      },
      {
        title: 'Lables',
        value: 'bug, wip',
      },
    ]);
  });
});
