const bodyParser = require('body-parser');

const unfurls = require('../unfurls');
const commands = require('../commands');
const oauth = require('./oauth');
const importer = require('./importer');
const uninstall = require('./uninstall');
const middleware = require('./../middleware');
const create = require('../create');
const userSettings = require('../user-settings');

module.exports = (robot) => {
  const router = robot.route('/slack');

  // Make robot available
  router.use((req, res, next) => {
    res.locals.robot = robot;
    next();
  });

  router.use(bodyParser.json());
  router.use(bodyParser.urlencoded({ extended: true }));

  // Set up slash commands
  commands(robot);

  // Set up OAuth
  router.get('/oauth/login', oauth.login);
  router.get('/oauth/callback', oauth.callback);

  // Set up event handlers
  router.use('/events', middleware.validate);
  router.use('/events', middleware.urlVerification);
  router.use('/events', middleware.routeEvent);

  router.post('/events.link_shared', unfurls.linkShared);
  router.post('/events.config_migration', importer);
  router.post('/events.app_uninstalled', uninstall);

  router.use('/actions', middleware.parseActionPayload);
  router.use('/actions', middleware.validate);
  router.use('/actions', middleware.attachMetaData);
  router.use('/actions', middleware.routeAction);

  // Format: '/actions:type:callback_id:action'
  router.post(/actions:interactive_message:unfurl-\d+:unfurl-dismiss/, unfurls.showRichPreview.dismissPrompt);
  router.post(/actions:interactive_message:unfurl-\d+:unfurl/, unfurls.showRichPreview.deliverUnfurl);

  router.post(/actions:interactive_message:unfurl-auto-.*:this-channel/, unfurls.unfurlAutoSetting.thisChannel);
  router.post(/actions:interactive_message:unfurl-auto-.*:all-channels/, unfurls.unfurlAutoSetting.allChannels);

  router.post('/actions:interactive_message:unfurl-mute-prompts:mute-24h', unfurls.mutePrompts.mute24h);
  router.post('/actions:interactive_message:unfurl-mute-prompts:mute-indefinitely', unfurls.mutePrompts.muteIndefinitely);

  router.post('/actions:interactive_message:unfurl-settings-auto:get-settings-for-repo', userSettings.unfurlAutoGetSettingsByRepo);
  router.post('/actions:interactive_message:unfurl-settings-auto:remove-repo', userSettings.unfurlAutoSettingsRemoveRepo);
  router.post('/actions:interactive_message:unfurl-settings:unmute-prompts', userSettings.unfurlPromptsUnmute);

  router.post(/actions:interactive_message:.*:cancel/, unfurls.cancel);

  router.post('/actions:dialog_submission:create-issue-dialog', create.dialogSubmit);

  router.post(
    '/actions:message_action:attach-to-issue',
    middleware.requireGitHubUser,
    create.attachToIssueFromMessage,
  );
  router.post(
    '/actions:dialog_submission:add-comment',
    middleware.requireGitHubUser,
    create.createCommentFromDialog,
  );

  router.post(/actions:.*/, (req) => {
    throw new Error(`Handler for URL "${req.url}" not found`);
  });
};
