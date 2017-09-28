const {
  arrayToFormattedString,
  getHexColorbyState,
  getFormattedState,
  getStatusColor,
} = require('../lib/helpers');

const constants = require('../lib/constants');


test('formats assignee array into string (multiple)', () => {
  expect(
    arrayToFormattedString(
      [
        {
          login: 'bkeepers',
        },
        {
          login: 'wilhelmklopp',
        },
      ],
      'login',
    ),
  ).toBe('bkeepers, wilhelmklopp');
});

test('formats assignee array into string (single)', () => {
  expect(
    arrayToFormattedString(
      [
        {
          login: 'bkeepers',
        },
      ],
      'login',
    ),
  ).toBe('bkeepers');
});

test('gets green hex color on open state', () => {
  expect(
    getHexColorbyState('open'),
  ).toBe(constants.OPEN_GREEN);
});

test('gets red hex color on closed state', () => {
  expect(
    getHexColorbyState('closed', false),
  ).toBe(constants.CLOSED_RED);
});

test('gets purple hex color on closed and merged state', () => {
  expect(
    getHexColorbyState('closed', true),
  ).toBe(constants.MERGED_PURPLE);
});

test('gets correct formatted open state', () => {
  expect(
    getFormattedState('open'),
  ).toBe(':green_heart: Open');
});

test('gets correct formatted closed state', () => {
  expect(
    getFormattedState('closed', false),
  ).toBe(':heart: Closed');
});

test('gets correct formatted merged state', () => {
  expect(
    getFormattedState('closed', true),
  ).toBe(':purple_heart: Merged');
});

test('gets correct status color on success', () => {
  expect(
    getStatusColor('success'),
  ).toBe(constants.STATUS_SUCCESS);
});

test('gets correct status color on pending', () => {
  expect(
    getStatusColor('pending'),
  ).toBe(constants.STATUS_PENDING);
});

test('gets correct status color on failure', () => {
  expect(
    getStatusColor('failure'),
  ).toBe(constants.STATUS_FAILURE);
});

test('gets correct status color on error', () => {
  expect(
    getStatusColor('error'),
  ).toBe(constants.STATUS_FAILURE);
});
