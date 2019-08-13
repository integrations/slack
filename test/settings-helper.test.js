const { parseSettings } = require('../lib/settings-helper');

describe('parsed labels', () => {
  test('detects labels', () => {
    const parsed = parseSettings(['label:todo', 'label:wip']);
    expect(parsed.labels).toEqual(['todo', 'wip']);
  });

  test('de-duplicates labels', () => {
    const parsed = parseSettings(['label:todo', 'label:todo', 'label:wip']);
    expect(parsed.labels).toEqual(['todo', 'wip']);
  });

  test('discards label without delimiter', () => {
    const parsed = parseSettings(['label', 'label:todo', 'label:wip']);
    expect(parsed.labels).toEqual(['todo', 'wip']);
    expect(parsed.features).toEqual([]);
  });

  test('discards label without value', () => {
    const parsed = parseSettings(['label:', 'label:todo', 'label:wip']);
    expect(parsed.labels).toEqual(['todo', 'wip']);
    expect(parsed.features).toEqual([]);
  });

  test('handles quoted spaces', () => {
    const parsed = parseSettings(['label:"Help wanted"', 'label:todo', 'label:wip']);
    expect(parsed.labels).toEqual(['Help wanted', 'todo', 'wip']);
    expect(parsed.features).toEqual([]);
  });

  test('handles colons spaces', () => {
    const parsed = parseSettings(['label:priority:HIGH', 'label:todo', 'label:wip']);
    expect(parsed.labels).toEqual(['priority:HIGH', 'todo', 'wip']);
    expect(parsed.features).toEqual([]);
  });
  test('extracts invalid entries correctly', () => {
    const parsed = parseSettings([
      'label:priority:HIGH',
      'label:todo',
      'label:wip',
      'label:not,wanted',
    ]);

    expect(parsed.features).toEqual([]);
    expect(parsed.labels).toEqual(['priority:HIGH', 'todo', 'wip']);
    expect(parsed.invalids.length).toEqual(1);
  });

  test('extracts rich error information ', () => {
    const parsed = parseSettings(['label:wip', 'label:not,wanted']);
    const expectedError = {
      raw: 'label:not,wanted',
      key: 'label',
      val: 'not,wanted',
    };

    expect(parsed.labels).toEqual(['wip']);
    expect(parsed.invalids).toEqual([expectedError]);
  });
});
