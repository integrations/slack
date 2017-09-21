const moment = require('moment');

module.exports = async function unfurlRepo(repo) {
  return {
    fallback: repo.full_name,
    title: repo.full_name,
    text: repo.description,
    fields: [
      {
        title: 'Website',
        value: repo.homepage,
        short: true,
      },
      {
        title: 'Watchers',
        value: repo.watchers_count,
        short: true,
      },
      {
        title: 'Stars',
        value: repo.stargazers_count,
        short: true,
      },
      {
        title: 'Forks',
        value: repo.network_count,
        short: true,
      },
      {
        title: 'Last updated',
        value: moment(repo.updated_at).fromNow(),
        short: true,
      },
      {
        title: 'Language',
        value: repo.language,
        short: true,
      },
    ],
    mrkdwn_in: ['text', 'fields'],
  };
};
