module.exports = class Channel {
  constructor({
    id, workspaceId, cache, slackWorkspace, logger,
  }) {
    this.id = id;
    this.workspaceId = workspaceId;
    this.cache = cache;
    this.slackWorkspace = slackWorkspace;
    this.logger = logger;
  }

  cacheKey(...parts) {
    return [`channel#${this.workspaceId}#${this.id}`].concat(parts).join(':');
  }

  async post(message) {
    const res = await this.slackWorkspace.botClient.chat.postMessage({
      channel: this.id,
      ...message.toJSON(),
    });
    this.logger.debug({ channel: this.id, res }, 'Posted Slack message');
    return res;
  }

  async update(ts, message) {
    const res = await this.slackWorkspace.botClient.chat.update({
      ts,
      channel: this.id,
      ...message.toJSON(),
    });
    this.logger.debug({ channel: this.id, res }, 'Updated Slack message');
    return res;
  }

  async rollup(message, { postNewIf = true, forceNew = false } = {}) {
    const cacheKey = this.cacheKey(message.identifier);

    const { ts } = (await this.cache.get(cacheKey)) || {};

    if (!forceNew && ts) {
      this.logger.trace({ channel: this.id, cacheKey, ts }, 'Rolling up changes');
      return this.update(ts, message);
    } else if (postNewIf) {
      this.logger.trace({ channel: this.id, cacheKey }, 'Posting a new message in slack');
      const res = await this.post(message);
      await this.cache.set(cacheKey, { ts: res.ts, channel: this.id });
      return res;
    }
  }

  // Make this object look like a slack client
  get chat() {
    return this.slackWorkspace.botClient.chat;
  }
};
