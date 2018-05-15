module.exports = class Channel {
  constructor({ id, cache, client }) {
    this.id = id;
    this.cache = cache;
    this.client = client;
  }

  cacheKey(...parts) {
    return [`channel#${this.id}`].concat(parts).join(':');
  }

  async post(message) {
    return this.client.chat.postMessage({ channel: this.id, ...message });
  }

  async update(ts, message) {
    return this.client.chat.update({ ts, channel: this.id, ...message });
  }

  async rollup(message) {
    const cacheKey = this.cacheKey(message.identifier);

    const ts = await this.cache.get(cacheKey);

    if (ts) {
      return this.update(ts, message.toJSON());
    }

    const res = await this.post(message.toJSON());
    await this.cache.set(cacheKey, res.ts);

    return res;
  }
};
