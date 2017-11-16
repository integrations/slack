const { Message } = require('../../../lib/slack/renderer');

const issuesOpened = require('../../fixtures/webhooks/issues.opened.json');

describe('Message rendering', () => {
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
