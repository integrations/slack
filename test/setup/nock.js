const nock = require('nock');
const path = require('path');

nock.disableNetConnect();

nock.back.fixtures = path.join(__dirname, '..', 'fixtures', 'nock');
nock.back.setMode('record');
