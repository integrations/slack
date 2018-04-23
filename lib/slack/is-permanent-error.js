const PERMANENT_ERRORS = [
  'no_permission',
  'account_inactive',
  'channel_not_found',
  'is_archived',
  'token_revoked',
];

module.exports = err => err.data && PERMANENT_ERRORS.includes(err.data.error);
