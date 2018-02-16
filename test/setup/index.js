const { exec } = require('child_process');
require('./env');
require('./nock');

// @todo: Should create and destroy database for each test suite
exec('./node_modules/.bin/sequelize db:migrate', (err, stdout, stderr) => {
  if (err) {
    console.log(`stderr: ${stderr}`);
    console.log(`stdout: ${stdout}`);
    console.log('err', err);
    // node couldn't execute the command
  }
});
