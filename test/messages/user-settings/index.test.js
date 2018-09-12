const { CombinedSettings } = require('../../../lib/messages/user-settings');


describe('CombinedSettings rendering', () => {
  test('works for both auto unfurl settings and muted prompts', async () => {
    const autoUnfurlRepos = [
      {
        id: 12345,
        full_name: 'integrations/snappydoo',
      },
      {
        id: 54321,
        full_name: 'integrations/html-to-mrkwdn',
      },
    ];
    const muteUnfurlPromptsIndefinitely = true;
    const attachments = new CombinedSettings({
      autoUnfurlRepos,
      muteUnfurlPromptsIndefinitely,
    }).getAttachments();
    expect({ attachments }).toMatchSnapshot();
    expect(attachments[0].actions[0].options[0].text).toBe('integrations/snappydoo');
    expect(attachments[0].actions[0].options[1].text).toBe('integrations/html-to-mrkwdn');
  });

  test('works for only auto unfurl settings', async () => {
    const autoUnfurlRepos = [
      {
        id: 12345,
        full_name: 'integrations/snappydoo',
      },
      {
        id: 54321,
        full_name: 'integrations/html-to-mrkwdn',
      },
    ];
    const attachments = new CombinedSettings({
      autoUnfurlRepos,
    }).getAttachments();
    expect({ attachments }).toMatchSnapshot();
  });

  test('works only for muted prompts', async () => {
    const muteUnfurlPromptsIndefinitely = true;
    const attachments = new CombinedSettings({
      muteUnfurlPromptsIndefinitely,
    }).getAttachments();
    expect({ attachments }).toMatchSnapshot();
  });

  test('works for temporarily muted prompts', async () => {
    Date.now = jest.fn(() => new Date(Date.UTC(2018, 4, 4)).valueOf());
    const muteUnfurlPromptsIndefinitely = false;
    const muteUnfurlPromptsUntil = 1525398771;
    const attachments = new CombinedSettings({
      muteUnfurlPromptsIndefinitely,
      muteUnfurlPromptsUntil,
    }).getAttachments();
    expect({ attachments }).toMatchSnapshot();
  });

  test('doesn\'t work if temporarily muted prompts is after current time', async () => {
    Date.now = jest.fn(() => new Date(Date.UTC(2018, 4, 4)).valueOf());
    const muteUnfurlPromptsIndefinitely = false;
    const muteUnfurlPromptsUntil = 1825398771;
    const attachments = new CombinedSettings({
      muteUnfurlPromptsIndefinitely,
      muteUnfurlPromptsUntil,
    }).getAttachments();
    expect({ attachments }).toMatchSnapshot();
  });
});
