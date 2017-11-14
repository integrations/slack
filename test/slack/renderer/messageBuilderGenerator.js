// look at all snapshots in renderer
// create folder for every snapshot file with /(.*).test.js.snap/
// in each folder create png for each snapshot using puppeteer

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { named } = require('named-regexp');
const RJSON = require('relaxed-json');

process.setMaxListeners(0);

async function getMessageBuilderImage(message, localPath) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  page.setViewport({ width: 1000, height: 600, deviceScaleFactor: 2 });
  await page.goto(`https://api.slack.com/docs/messages/builder?msg=${encodeURIComponent(message)}`);
  await page.waitForNavigation({ waitUntil: 'networkidle' });
  await page.waitForSelector('#message_loading_indicator', { hidden: true, timeout: 120000 });

  // https://github.com/GoogleChrome/puppeteer/issues/306#issuecomment-322929342
  async function screenshotDOMElement(selector, padding = 0) {
    const rect = await page.evaluate((selector) => {
      const element = document.querySelector(selector);
      const { x, y, width, height } = element.getBoundingClientRect();
      return { left: x, top: y, width, height, id: element.id };
    }, selector);

    return page.screenshot({
      path: localPath,
      clip: {
        x: rect.left - padding,
        y: rect.top - padding,
        width: rect.width + (padding * 2),
        height: rect.height + (padding * 2),
      },
    });
  }

  await screenshotDOMElement('#msgs_div');

  await browser.close();
}

fs.readdirSync(path.join(__dirname, '__snapshots__')).forEach((file) => {
  // eslint-disable-next-line no-useless-escape
  const match = named(new RegExp('^(:<class>[A-Za-z]+).test\.js\.snap')).exec(file);
  if (match) {
    const folderName = `__snapshots__/${match.captures.class[0]}`;
    if (!fs.existsSync(path.join(__dirname, folderName))) {
      fs.mkdirSync(path.join(__dirname, folderName));
    }

    const snapshots = require(path.join(__dirname, `__snapshots__/${file}`));
    Object.keys(snapshots).forEach(async (snapshot) => {
      const cleaned = snapshots[snapshot]
        .replace(/Object /g, '')
        .replace(/Array /g, '')
        .replace(/\n/g, '');
      let message = JSON.parse(RJSON.transform(cleaned));
      if (!message.attachments) {
        message = { attachments: [message] };
      }
      await getMessageBuilderImage(JSON.stringify(message), path.join(__dirname, `${folderName}/${snapshot}.png`));
    });
  }
});
