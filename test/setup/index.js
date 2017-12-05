const { exec } = require('child_process');
require('./env');
require('./nock');
require('./date');

// @todo: Should create and destroy database for each test suite
exec('./node_modules/.bin/sequelize db:migrate', (err, stdout, stderr) => {
  if (err) {
    console.log('err', err);
    // node couldn't execute the command
    return;
  }

  // the *entire* stdout and stderr (buffered)
  if (stdout) {
    console.log(`stdout: ${stdout}`);
  }
  if (stderr) {
    console.log(`stderr: ${stderr}`);
  }
});
