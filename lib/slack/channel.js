module.exports = class Channel {
  constructor({
    id, cache, client, logger,
  }) {
    this.id = id;
    this.cache = cache;
    this.client = client;
    this.logger = logger;
  }

  cacheKey(...parts) {
    return [`channel#${this.id}`].concat(parts).join(':');
  }

  async post(message) {
    const res = await this.client.chat.postMessage({ channel: this.id, ...message });
    this.logger.debug({ channel: this.id, res }, 'Posted Slack message');
    return res;
  }

  async update(ts, message) {
    const res = await this.client.chat.update({ ts, channel: this.id, ...message });
    this.logger.debug({ channel: this.id, res }, 'Updated Slack message');
    return res;
  }

  async rollup(message) {
    const cacheKey = this.cacheKey(message.identifier);

    const ts = await this.cache.get(cacheKey);

    if (ts) {
      this.logger.trace({ channel: this.id, cacheKey, ts }, 'Rolling up changes');
      return this.update(ts, message.toJSON());
    }

    this.logger.trace({ channel: this.id, cacheKey }, 'Posting a new message in slack');
    const res = await this.post(message.toJSON());
    await this.cache.set(cacheKey, res.ts);

    return res;
  }

  // Make this object look like a slack client
  get chat() {
    return this.client.chat;
  }
};
