const axios = require('axios');
const { parseSubscriptionArgString } = require('../settings-helper');

const SUBCOMMAND = /^(\w+) *(.*)$/;

function normalizeQuotes(text) {
  return text
    .replace(/\u00AB/g, '"')
    .replace(/\u00BB/g, '"')
    .replace(/\u201C/g, '"')
    .replace(/\u201D/g, '"')
    .replace(/\u201E/g, '"')
    .replace(/\u201F/g, '"');
}

module.exports = class Command {
  constructor(body, callback) {
    Object.assign(this, body);
    this.callback = callback;

    this.text = normalizeQuotes(this.text);
    // Check for subcommand in the command text
    const match = this.text.match(SUBCOMMAND);

    if (match) {
      const [, subcommand, argString] = match;
      this.subcommand = subcommand;
      // command text without subcommand
      this.text = argString;

      if (this.subcommand.includes('subscribe')) {
        const parsed = parseSubscriptionArgString(argString);
        this.resource = parsed.resource;
        this.invalidInput = parsed.invalids;
        this.args = parsed;
      } else {
        const [resource, ...args] = argString.split(' ');
        this.args = args;
        this.resource = resource;
      }
    }
  }

  /**
   * Use the delayed response callback URL instead of the callback provided
   */
  delay() {
    this.callback = null;
  }

  respond(message) {
    return this.callback ? this.callback(message) : axios.post(this.response_url, message);
  }
};
