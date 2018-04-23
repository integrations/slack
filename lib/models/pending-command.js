const cache = require('../cache');

module.exports = () => {
  function key(trigger_id) {
    return `pending-command#${trigger_id}`;
  }

  return {
    name: 'PendingCommand',

    create(trigger_id, command) {
      return cache.set(key(trigger_id), command);
    },

    find(trigger_id) {
      return cache.get(key(trigger_id));
    },

    delete(trigger_id) {
      return cache.delete(key(trigger_id));
    },
  };
};
