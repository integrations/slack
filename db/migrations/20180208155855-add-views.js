module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      CREATE VIEW github_users AS (
        SELECT
          id,
          "createdAt" AS created_at,
          "updatedAt" AS updated_at
        FROM
          "GitHubUsers"
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE VIEW github_installations AS (
        SELECT
          id,
          "githubId" AS github_id,
          "ownerId" AS owner_id,
          "createdAt" AS created_at,
          "updatedAt" AS updated_at
        FROM
          "Installations"
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE VIEW slack_users AS (
        SELECT
          id,
          "slackId" AS slack_id,
          "createdAt" AS created_at,
          "updatedAt" AS updated_at,
          "githubId" AS github_id,
          "slackWorkspaceId" AS slack_workspace_id
        FROM
          "SlackUsers"
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE VIEW slack_workspaces AS (
        SELECT
          id,
          "slackId" AS slack_id,
          "createdAt" AS created_at,
          "updatedAt" AS updated_at
        FROM
          "SlackWorkspaces"
      );
    `);
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query('DROP VIEW github_users');
    await queryInterface.sequelize.query('DROP VIEW github_installations');
    await queryInterface.sequelize.query('DROP VIEW slack_users');
    await queryInterface.sequelize.query('DROP VIEW slack_workspaces');
  },
};
