const cache = require('../cache');

module.exports = () => {
  function key(id) {
    return `pending-command:${id}`;
  }

  return {
    name: 'PendingCommand',

    create(userId, command) {
      return cache.set(key(userId), command);
    },

    find(userId) {
      return cache.get(key(userId));
    },
  };
};
