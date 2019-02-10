const Command = require('../../lib/slack/command');

describe('Command class', () => {
  test('parses command text of repository subscription', () => {
    const command = new Command({ text: 'subscribe integration/slack' });

    expect(command.subcommand).toEqual('subscribe');
    expect(command.args).toEqual(['integration/slack']);
  });

  test('parses command text of repository subscription with settings', () => {
    const command = new Command({ text: 'subscribe integration/slack reviews label:priority:MUST label:"help wanted" label:\'good first issue\' label:area/api' });

    expect(command.subcommand).toEqual('subscribe');
    expect(command.args).toEqual(['integration/slack', 'reviews', 'label:priority:MUST', 'label:help wanted', 'label:good first issue', 'label:area/api']);
  });

  test('parses command text which separeted by commas', () => {
    const command = new Command({ text: 'subscribe integration/slack,reviews,label:priority:MUST' });

    expect(command.subcommand).toEqual('subscribe');
    expect(command.args).toEqual(['integration/slack', 'reviews', 'label:priority:MUST']);
  });
});
