const axios = require('axios');
const { parseSubscriptionArgString } = require('../settings-helper');

const SUBCOMMAND = /^(\w+) *(.*)$/;

module.exports = class Command {
  constructor(body, callback) {
    Object.assign(this, body);
    this.callback = callback;

    // Check for subcommand in the command text
    const match = this.text.match(SUBCOMMAND);

    if (match) {
      const [, subcommand, argString] = match;
      this.subcommand = subcommand;

      // Remove subcommand from the command text
      this.text = argString;

      // be smart about subscription target
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
