/* eslint-disable no-param-reassign */
const querystring = require('querystring');
const githubUrl = require('./github-url');

module.exports = (params = {}) => {
  params = Object.assign({
    subject: 'GitHub+Slack integration',
  }, params);

  const qs = Object.keys(params).reduce((result, param) => {
    result[`form[${param}]`] = params[param];
    return result;
  }, {});

  return githubUrl.resolve(`/contact?${querystring.stringify(qs)}`);
};
