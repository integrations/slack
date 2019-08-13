const axios = require('axios');

const SUBCOMMAND = /^(\w+) *(.*)$/;

module.exports = class Command {
  constructor(body, callback) {
    Object.assign(this, body);
    this.callback = callback;

    // Check for subcommand in the command text
    const match = this.text.match(SUBCOMMAND);

    if (match) {
      const [, subcommand, args] = match;
      this.subcommand = subcommand;

      // Remove subcommand from the command text
      this.text = args;

      // Save array of args
      this.args = (args.match(/(label:".*?"|label:'.*?'|[^\s,]+)/g) || [])
        .map(x => x.replace(/label:["']/, 'label:').replace(/["']$/, ''));
    }
  }

  /**
   * Use the delayed response callback URL instead of the callback provided
   */
  delay() {
    this.callback = null;
  }

  respond(message) {
    return this.callback ? this.callback(message)
      : axios.post(this.response_url, message);
  }
};
