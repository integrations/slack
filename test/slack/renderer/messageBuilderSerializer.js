const prettyFormat = require('pretty-format'); // same as built in default jest serializer
const puppeteer = require('puppeteer');

async function getMessageBuilderImage(val) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(`https://api.slack.com/docs/messages/builder?msg=${encodeURIComponent(val)}`);
  await page.screenshot({ path: 'test/slack/renderer/__snapshots__/example.png' });

  await browser.close();
  return prettyFormat(val);
}

const messageBuilderSerializer = {
  test: val => val, // always use this
  print: async (val) => {
    const serialized = await getMessageBuilderImage(val);
    console.log(serialized);
    return serialized;
  },
};

module.exports = {
  messageBuilderSerializer,
};
