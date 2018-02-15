module.exports = () => {
  class Channel {
    constructor(id, workspace) {
      this.id = id;
      this.workspace = workspace;
    }
  }

  return Channel;
};
