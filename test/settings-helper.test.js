const { parseSettings, parseSubscriptionArgString } = require('../lib/settings-helper');

describe('parseSettings', () => {
  test('detects labels', () => {
    const parsed = parseSettings(['+label:todo', '+label:wip']);
    expect(parsed.required_labels).toEqual(['todo', 'wip']);
  });

  test('detects format=full', () => {
    const parsed = parseSettings('format=full');
    expect(parsed.format).toEqual('full');
  });

  test('detects format=condensed', () => {
    const parsed = parseSettings('format=condensed');
    expect(parsed.format).toEqual('condensed');
  });

  test('de-duplicates labels', () => {
    const parsed = parseSettings(['+label:todo', '+label:todo', '+label:wip']);
    expect(parsed.required_labels).toEqual(['todo', 'wip']);
  });

  test('de-duplicates format', () => {
    const parsed = parseSettings(['format=full', 'format=condensed']);
    expect(parsed.format).toEqual('condensed');
    expect(parsed.invalids).toEqual([]);
  });

  test('discards label without delimiter', () => {
    const parsed = parseSettings(['+label', '+label:todo', '+label:wip']);
    expect(parsed.required_labels).toEqual(['todo', 'wip']);
    expect(parsed.features).toEqual([]);
    expect(parsed.format).toEqual(undefined);
  });

  test('discards label without value', () => {
    const parsed = parseSettings(['+label:', '+label:todo', '+label:wip']);
    expect(parsed.required_labels).toEqual(['todo', 'wip']);
    expect(parsed.features).toEqual([]);
    expect(parsed.format).toEqual(undefined);
  });

  test('handles quoted spaces', () => {
    const parsed = parseSettings(['+label:"Help wanted"', '+label:todo', '+label:wip']);
    expect(parsed.required_labels).toEqual(['Help wanted', 'todo', 'wip']);
    expect(parsed.features).toEqual([]);
    expect(parsed.format).toEqual(undefined);
  });

  test('handles colons in label values', () => {
    const parsed = parseSettings(['+label:priority:HIGH', '+label:todo', '+label:wip']);
    expect(parsed.required_labels).toEqual(['priority:HIGH', 'todo', 'wip']);
    expect(parsed.features).toEqual([]);
    expect(parsed.format).toEqual(undefined);
  });

  test('extracts invalid label entries correctly', () => {
    const parsed = parseSettings([
      '+label:priority:HIGH',
      '+label:todo',
      '+label:wip',
      '+label:not,wanted',
    ]);

    expect(parsed.features).toEqual([]);
    expect(parsed.required_labels).toEqual(['priority:HIGH', 'todo', 'wip']);
    expect(parsed.format).toEqual(undefined);
    expect(parsed.invalids.length).toEqual(1);
  });

  test('extracts invalid format entry correctly', () => {
    const parsed = parseSettings('format=simple');

    expect(parsed.features).toEqual([]);
    expect(parsed.required_labels).toEqual([]);
    expect(parsed.format).toEqual(undefined);
    expect(parsed.invalids.length).toEqual(1);
  });

  test('extracts rich label error information', () => {
    const parsed = parseSettings(['+label:wip', '+label:not,wanted']);
    const expectedError = {
      raw: '+label:not,wanted',
      key: '+label',
      val: 'not,wanted',
    };

    expect(parsed.required_labels).toEqual(['wip']);
    expect(parsed.invalids).toEqual([expectedError]);
  });

  test('extracts rich format error information', () => {
    const parsed = parseSettings('format=simple');
    const expectedError = {
      raw: 'format=simple',
      key: 'format',
      val: 'simple',
    };
    expect(parsed.format).toEqual(undefined);
    expect(parsed.invalids).toEqual([expectedError]);
  });
});

describe('hasValue', () => {
  test('hasValue is true if a label is present', () => {
    const parsed = parseSettings(['+label:wip']);
    expect(parsed.hasValues).toBeTruthy();
  });

  test('hasValue is true if a feature is present', () => {
    const parsed = parseSettings(['comments']);
    expect(parsed.hasValues).toBeTruthy();
  });

  test('hasValue is true if a format is present', () => {
    const parsed = parseSettings('format:full');
    expect(parsed.hasValues).toBeTruthy();
  });

  test('hasValue is true if only a invalid label is present', () => {
    const parsed = parseSettings(['+label:wip,,,,']);
    expect(parsed.hasValues).toBeTruthy();
  });

  test('hasValue is true if a valid and an invalid label is present', () => {
    const parsed = parseSettings(['+label:invalid,,,,', '+label:valid']);
    expect(parsed.hasValues).toBeTruthy();
  });

  test('hasValue is true if an invalid label and a feature is present', () => {
    const parsed = parseSettings(['+label:invalid,,,,', 'issues']);
    expect(parsed.hasValues).toBeTruthy();
  });
});

describe('parseSettingsArgs', () => {
  test('knows if values are present ', () => {
    const parsed = parseSubscriptionArgString('github/hub pulls issues +label:ready-to-review format=full');
    expect(parsed.hasValues).toBeTruthy();
  });

  test('features extracted unparsed', () => {
    const parsed = parseSubscriptionArgString('github/hub pulls issues commits:all +label:ready-to-review');
    expect(parsed.features).toEqual(['pulls', 'issues', 'commits:all']);
  });

  test('labels are parsed', () => {
    const parsed = parseSubscriptionArgString('github/hub pulls issues commits:all +label:ready-to-review');
    expect(parsed.required_labels).toEqual(['ready-to-review']);
  });

  test('format is parsed', () => {
    const parsed = parseSubscriptionArgString('github/hub pulls issues commits:all +label:ready-to-review format=condensed');
    expect(parsed.format).toEqual('condensed');
  });

  test('extracts the resource', () => {
    const parsed = parseSubscriptionArgString('github/hub pulls issues commits:all +label:ready-to-review');
    expect(parsed.resource).toEqual('github/hub');
  });
});
