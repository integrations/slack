const { SlackWorkspace } = require('.');

describe('SlackWorkspace', () => {
  let user;
  beforeEach(async () => {
    user = await SlackWorkspace.create({
      slackId: 'T0001',
      accessToken: 'test',
    });
  });

  test('toJSON excludes accessToken', () => {
    expect(user.toJSON()).not.toHaveProperty('accessToken');
    expect(user.toJSON()).not.toHaveProperty('secrets');

    // ensure original values weren't deleted
    expect(user.accessToken).toEqual('test');
  });
});
