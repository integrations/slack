module.exports = {
  name: 'boom',
  action() {
    throw new Error('boom');
  },
};
