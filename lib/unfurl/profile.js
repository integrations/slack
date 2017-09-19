module.exports = function unfurlProfile(profile) {
  // TODO: handle organizations differently than users
  return {
    fallback: `${profile.login} (${profile.name})`,
    title: `${profile.login} (${profile.name})`,
    text: profile.bio,
    fields: [
      {
        title: 'Company',
        value: profile.company,
        short: true,
      },
      {
        title: 'Location',
        value: profile.location,
        short: true,
      },
      {
        title: 'URL',
        value: profile.blog,
        short: true,
      },
      {
        title: 'Repositories',
        value: profile.public_repos,
        short: true,
      },
      {
        title: 'Followers',
        value: profile.followers,
        short: true,
      },
    ],
    thumb_url: profile.avatar_url,
    mrkdwn_in: ['pretext', 'text', 'fields'],
  };
};
