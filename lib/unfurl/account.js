module.exports = async function unfurlAccount(account) {
  if (account.type === 'User') {
    return {
      fallback: `${account.login} (${account.name})`,
      title: `${account.login} (${account.name})`,
      text: account.bio,
      fields: [
        {
          title: 'Company',
          value: account.company,
          short: true,
        },
        {
          title: 'Location',
          value: account.location,
          short: true,
        },
        {
          title: 'URL',
          value: account.blog,
          short: true,
        },
        {
          title: 'Repositories',
          value: account.public_repos,
          short: true,
        },
        {
          title: 'Followers',
          value: account.followers,
          short: true,
        },
      ],
      thumb_url: account.avatar_url,
      mrkdwn_in: ['pretext', 'text', 'fields'],
    };
  } else if (account.type === 'Organization') {
    return {
      fallback: `${account.name}`,
      title: `${account.name}`,
      text: account.bio,
      fields: [
        {
          title: 'Location',
          value: account.location,
          short: true,
        },
        {
          title: 'URL',
          value: account.blog,
          short: true,
        },
        {
          title: 'Repositories',
          value: account.public_repos,
          short: true,
        },
      ],
      thumb_url: account.avatar_url,
      mrkdwn_in: ['pretext', 'text', 'fields'],
    };
  }
};
