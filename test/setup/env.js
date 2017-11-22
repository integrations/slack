// // Change default LOG_LEVEL to error unless it is explicitly set
// process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'error';
// process.env.SLACK_VERIFICATION_TOKEN = 'test';
// process.env.DATABASE_URL = 'postgres://localhost:5432/slack-test';

require('dotenv').load({ path: '.env.test' });
