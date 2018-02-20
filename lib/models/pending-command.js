const cache = require('../cache');

module.exports = () => {
  function key(workspace, user) {
    return `pending-command#${workspace}${user}`;
  }

  return {
    name: 'PendingCommand',

    create(workspace, user, command) {
      return cache.set(key(workspace, user), command);
    },

    find(workspace, user) {
      return cache.get(key(workspace, user));
    },

    delete(workspace, user) {
      return cache.delete(key(workspace, user));
    },
  };
};
