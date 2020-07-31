const gh = require('../lib/github-url');

describe('github-url', () => {
  afterEach(() => {
    delete process.env.GHE_HOST;
  });

  const examples = (host) => ({
    [`https://${host}/foo/bar/issues/999`]: {
      type: 'issue', owner: 'foo', repo: 'bar', number: '999',
    },
    [`https://${host}/foo/bar/pull/123`]: {
      type: 'pull', owner: 'foo', repo: 'bar', number: '123',
    },
    [`https://${host}/foo/bar/pull/987#issuecomment-112233`]: {
      type: 'comment', owner: 'foo', repo: 'bar', number: '987', id: '112233',
    },
    [`https://${host}/foo/bar/issues/987#issuecomment-112233`]: {
      type: 'comment', owner: 'foo', repo: 'bar', number: '987', id: '112233',
    },
    [`https://${host}/atom/atom/blob/master/src/color.js`]: {
      type: 'blob', owner: 'atom', repo: 'atom', ref: 'master', path: 'src/color.js',
    },
    [`https://${host}/atom/atom/blob/master/src/color.js#L122`]: {
      type: 'blob', owner: 'atom', repo: 'atom', ref: 'master', path: 'src/color.js', line: '122',
    },
    [`https://${host}/atom/atom/blob/master/src/color.js#L122-L129`]: {
      type: 'blob', owner: 'atom', repo: 'atom', ref: 'master', path: 'src/color.js', line: ['122', '129'],
    },
    [`https://${host}/wilhelmklopp`]: {
      type: 'account', owner: 'wilhelmklopp',
    },
    [`https://${host}/bkeepers/dotfiles`]: {
      type: 'repo', owner: 'bkeepers', repo: 'dotfiles',
    },
    'foo/bar': {
      type: 'repo', owner: 'foo', repo: 'bar',
    },
    'foo/bar#123': {
      type: 'issue', owner: 'foo', repo: 'bar', number: '123',
    },
  });

  function testRouteParsing(host) {
    const exampleMap = examples(host);

    Object.keys(exampleMap).forEach((link) => {
      test(`parses ${link}`, () => {
        expect(gh(link)).toEqual(exampleMap[link]);
      });
    });
  }

  describe('with default host', () => {
    testRouteParsing('github.com');
  });

  describe('with a custom GHE_HOST host', () => {
    const gheHost = 'github.example.com';

    beforeEach(() => {
      process.env.GHE_HOST = gheHost;
    });

    testRouteParsing(gheHost);
  });
});
