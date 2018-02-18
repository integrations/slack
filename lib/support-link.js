/* eslint-disable no-param-reassign */
const querystring = require('querystring');

module.exports = (params = {}) => {
  params = Object.assign({
    subject: 'GitHub+Slack integration',
  }, params);

  const qs = Object.keys(params).reduce((result, param) => {
    result[`form[${param}]`] = params[param];
    return result;
  }, {});

  return `https://github.com/contact?${querystring.stringify(qs)}`;
};
