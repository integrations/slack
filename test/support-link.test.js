const supportLink = require('../lib/support-link');

describe('SupportLink', () => {
  test('default', () => {
    expect(supportLink()).toEqual('https://github.com/contact?form%5Bsubject%5D=GitHub%2BSlack%20integration');
  });

  test('overriding subject', () => {
    expect(supportLink({ subject: 'Greetings' })).toEqual('https://github.com/contact?form%5Bsubject%5D=Greetings');
  });


  test('comments', () => {
    expect(supportLink({ comments: 'Hello World' })).toEqual('https://github.com/contact?form%5Bsubject%5D=GitHub%2BSlack%20integration&form%5Bcomments%5D=Hello%20World');
  });
});
