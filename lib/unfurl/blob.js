module.exports = function unfurlBlob(blob, params) {
  let lines = Buffer.from(blob.content, 'base64').toString().split(/\n/);
  let title = blob.path;
  let link = blob.html_url;

  let [start, end] = [].concat(params.line || []);

  if (start) {
    start = Number(start);
    end = Number(end || start);

    lines = lines.slice(start - 1, end);

    title += `:${start}`;
    link += `#L${start}`;
    if (end !== start) {
      title += `-${end}`;
      link += `-L${end}`;
    }
  }

  return {
    fallback: title,
    title,
    text: `\`\`\`\n${lines.join('\n')}\n\`\`\``,
    footer: `<${link}|View it on GitHub>`,
    footer_icon: 'https://assets-cdn.github.com/favicon.ico',
    mrkdwn_in: ['pretext', 'text'],
  };
};
