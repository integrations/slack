const Command = require('../../lib/slack/command');

describe('Command class', () => {
  test('parses command text of repository subscription', () => {
    const command = new Command({ text: 'subscribe integration/slack' });

    expect(command.subcommand).toEqual('subscribe');
  });

  test('extracts the subscription target', () => {
    const command = new Command({ text: 'subscribe integration/slack' });
    expect(command.subcommand).toEqual('subscribe');
    expect(command.args.resource).toEqual('integration/slack');
  });

  test('parses subscribe command text with features', () => {
    const command = new Command({
      text: 'subscribe integration/slack reviews commits:all comments',
    });

    expect(command.subcommand).toEqual('subscribe');
    expect(command.args.resource).toEqual('integration/slack');
    expect(command.args.features).toEqual({ reviews: true, commits: 'all', comments: true });
  });

  test('parses command text of repository subscription with settings', () => {
    const command = new Command({
      text:
        'subscribe integration/jira reviews label:priority:MUST label:"help wanted" label:"good first issue" label:area/api',
    });

    expect(command.subcommand).toEqual('subscribe');
    expect(command.args.resource).toEqual('integration/jira');
    expect(command.args.features).toEqual({ reviews: true });
    expect(command.args.labels).toEqual([
      'area/api',
      'good first issue',
      'help wanted',
      'priority:MUST',
    ]);
  });
});
