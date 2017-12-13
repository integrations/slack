// Temproary migration to add the existing workspace. This can be deleted once
// it has been run on production.

module.exports = {
  up: async (queryInterface) => {
    const workspaceId = 'T0CA8C346';
    const accessToken = process.env.SLACK_ACCESS_TOKEN;

    await queryInterface.sequelize.query(`
      INSERT INTO "SlackWorkspaces" ("slackId", "accessToken", "createdAt", "updatedAt")
      VALUES ('${workspaceId}', '${accessToken}', current_timestamp, current_timestamp)
    `);

    await queryInterface.sequelize.query(`
      UPDATE "SlackUsers"
      SET "slackWorkspaceId" = "SlackWorkspaces"."id"
      FROM "SlackWorkspaces"
      WHERE "SlackWorkspaces"."slackId" = '${workspaceId}'
    `);

    await queryInterface.sequelize.query(`
      UPDATE "Subscriptions"
      SET "slackWorkspaceId" = "SlackWorkspaces"."id"
      FROM "SlackWorkspaces"
      WHERE "SlackWorkspaces"."slackId" = '${workspaceId}'
    `);
  },

  down: () => {

  },
};
