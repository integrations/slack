const nock = require('nock');

nock.disableNetConnect();
nock.enableNetConnect('127.0.0.1');
