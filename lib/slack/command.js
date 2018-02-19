const SUBCOMMAND = /^(\w+) *(.*)$/;

module.exports = class Command {
  constructor(body) {
    Object.assign(this, body);

    // Check for subcommand in the command text
    const match = this.text.match(SUBCOMMAND);

    if (match) {
      const [, subcommand, args] = match;
      this.subcommand = subcommand;

      // Remove subcommand from the command text
      this.text = args;

      // Save array of args
      this.args = args.split(' ');
    }
  }
};
