const {
  Message,
} = require('./index');

class Blob extends Message {
  constructor({ blob, repository, line }) {
    const [start, end] = [].concat(line || []);
    super({
      footer: `<${repository.html_url}|${repository.full_name}>`,
    });
    this.blob = blob;
    this.line = line;
    this.start = start;
    this.end = end;
  }

  getCore() {
    let lines = Buffer.from(this.blob.content, 'base64').toString().split(/\n/);
    let title = this.blob.path;
    let htmlURL = this.blob.html_url;

    if (this.start) {
      lines = lines.slice(
        Number(this.start) - 1,
        Number(this.end || this.start),
      );

      title += `:${this.start}`;
      htmlURL += `#L${this.start}`;

      if (this.end) {
        title += `-${this.end}`;
        htmlURL += `-L${this.end}`;
      }
    }

    const tripleBackTick = '```';
    return {
      fallback: title,
      title,
      title_link: htmlURL,
      text: `${tripleBackTick}\n${lines.join('\n')}\n${tripleBackTick}`,
    };
  }

  getRenderedMessage() {
    return {
      ...super.getBaseMessage(),
      ...this.getCore(),
      mrkdwn_in: ['text'],
    };
  }
}

module.exports = {
  Blob,
};
