const express = require('express');
const path = require('path');
const querystring = require('querystring');

const app = express();

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, '..', 'views'));

app.use('/static', express.static(path.join(__dirname, '..', 'static')));

app.get('/', (req, res) => {
  res.render('index.hbs');
});

app.get('/denied', (req, res) => {
  const params = querystring.stringify({
    'form[subject]': 'GitHub+Slack integration',
    'form[comments]': 'I would like to join the beta for the new GitHub+Slack ' +
      'integration.\n\nThe URL for my Slack team is YOUR-DOMAIN.slack.com and ' +
      'I have registered for the pre-release program at ' +
      'https://github.com/prerelease/agreement',
  });

  res.render('denied', { url: `https://github.com/support?${params}` });
});


module.exports = app;
