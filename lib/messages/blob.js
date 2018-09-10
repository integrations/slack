const isBinaryFile = require('isbinaryfile');
const {
  Message,
} = require('./index');

class Blob extends Message {
  constructor({
    blob, repository, line, unfurlType,
  }) {
    const [start, end] = [].concat(line || []);
    super({
      footer: `<${repository.html_url}|${repository.full_name}>`,
    });
    this.repository = repository;
    this.blob = blob;
    this.line = line;
    this.start = start;
    this.end = end;
    this.unfurlType = unfurlType;
  }

  getCore() {
    const buffer = Buffer.from(this.blob.content, 'base64');

    let title = this.blob.path;
    let htmlURL = this.blob.html_url;

    // don't unfurl binary files
    if (isBinaryFile.sync(buffer, this.blob.size)) {
      throw new Error('File is binary');
    }

    let lines = buffer.toString().split(/\n/);

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
      fallback: `[${this.repository.full_name}] ${title}`,
      title,
      title_link: htmlURL,
      text: `${tripleBackTick}\n${lines.join('\n')}\n${tripleBackTick}`,
    };
  }

  getRenderedMessage() {
    const baseMessage = {
      ...super.getBaseMessage(),
      ...this.getCore(),
      mrkdwn_in: ['text'],
    };
    if (this.unfurlType === 'condensed') {
      return this.constructor.convertToCondensedAttachment(baseMessage);
    }
    return baseMessage;
  }
}

module.exports = {
  Blob,
};
