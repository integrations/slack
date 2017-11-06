const {
  Message,
} = require('./index');

class Blob extends Message {
  constructor(constructorObject) {
    const [start, end] = [].concat(constructorObject.line || []);
    let htmlURL = constructorObject.blob.html_url;
    if (start) {
      htmlURL += `#L${start}`;
      if (end) {
        htmlURL += `-L${end}`;
      }
    }
    super({
      includeFooter: true,
      footerURL: htmlURL,
    });
    this.blob = constructorObject.blob;
    this.line = constructorObject.line;
    this.start = start;
    this.end = end;
  }

  getCore() {
    let lines = Buffer.from(this.blob.content, 'base64').toString().split(/\n/);
    let title = this.blob.path;

    if (this.start) {
      lines = lines.slice(
        Number(this.start) - 1,
        Number(this.end || this.start),
      );

      title += `:${this.start}`;
      if (this.end) {
        title += `-${this.end}`;
      }
    }

    const tripleBackTick = '```';
    return {
      fallback: title,
      title,
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
