module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      CREATE VIEW github_users AS (
        SELECT
          cast(id AS int) AS id,
          "createdAt" AS created_at,
          "updatedAt" AS updated_at
        FROM
          "GitHubUsers"
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE VIEW slack_installs AS (
        SELECT
          cast(id AS int) AS id,
          cast("githubId" AS int) AS github_id,
          cast("ownerId" AS int) AS owner_id,
          "createdAt" AS created_at,
          "updatedAt" AS updated_at
        FROM
          "Installations"
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE VIEW slack_users AS (
        SELECT
          cast(id AS int) AS id,
          cast("slackId" AS int) AS slack_id,
          "createdAt" AS created_at,
          "updatedAt" AS updated_at,
          cast("githubId" AS int) AS github_id,
          cast("slackWorkspaceId" AS int) AS slack_workspace_id
        FROM
          "SlackUsers"
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE VIEW slack_workspaces AS (
        SELECT
          cast(id AS int) AS id,
          cast("slackId" AS int) AS slack_id,
          "createdAt" AS created_at,
          "updatedAt" AS updated_at
        FROM
          "SlackWorkspaces"
      );
    `);
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query('DROP VIEW github_users');
    await queryInterface.sequelize.query('DROP VIEW slack_installs');
    await queryInterface.sequelize.query('DROP VIEW slack_users');
    await queryInterface.sequelize.query('DROP VIEW slack_workspaces');
  },
};
