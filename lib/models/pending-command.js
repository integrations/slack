const cache = require('../cache');

module.exports = () => {
  function key(id) {
    return `pending-command#${id}`;
  }

  return {
    name: 'PendingCommand',

    create(id, command) {
      return cache.set(key(id), command);
    },

    find(id) {
      return cache.get(key(id));
    },

    delete(id) {
      return cache.delete(key(id));
    },
  };
};
