const { Account } = require('../messages/account');

module.exports = async (params, github, unfurlType) => {
  const { owner } = params;
  const account = (await github.users.getByUsername({ username: owner })).data;
  const accountMessage = new Account({ account, unfurlType });
  return accountMessage.getRenderedMessage();
};
