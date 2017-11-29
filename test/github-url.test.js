const gh = require('../lib/github-url');

describe('github-url', () => {
  const examples = {
    'https://github.com/foo/bar/issues/999': {
      type: 'issue', owner: 'foo', repo: 'bar', number: '999',
    },
    'https://github.com/foo/bar/pull/123': {
      type: 'pull', owner: 'foo', repo: 'bar', number: '123',
    },
    'https://github.com/foo/bar/pull/987#issuecomment-112233': {
      type: 'comment', owner: 'foo', repo: 'bar', number: '987', id: '112233',
    },
    'https://github.com/foo/bar/issues/987#issuecomment-112233': {
      type: 'comment', owner: 'foo', repo: 'bar', number: '987', id: '112233',
    },
    'https://github.com/atom/atom/blob/master/src/color.js': {
      type: 'blob', owner: 'atom', repo: 'atom', ref: 'master', path: 'src/color.js',
    },
    'https://github.com/atom/atom/blob/master/src/color.js#L122': {
      type: 'blob', owner: 'atom', repo: 'atom', ref: 'master', path: 'src/color.js', line: '122',
    },
    'https://github.com/atom/atom/blob/master/src/color.js#L122-L129': {
      type: 'blob', owner: 'atom', repo: 'atom', ref: 'master', path: 'src/color.js', line: ['122', '129'],
    },
    'https://github.com/wilhelmklopp': {
      type: 'account', owner: 'wilhelmklopp',
    },
    'https://github.com/bkeepers/dotfiles': {
      type: 'repo', owner: 'bkeepers', repo: 'dotfiles',
    },
    'foo/bar': {
      type: 'repo', owner: 'foo', repo: 'bar',
    },
  };

  Object.keys(examples).forEach((link) => {
    test(`parses ${link}`, () => {
      expect(gh(link)).toEqual(examples[link]);
    });
  });
});
