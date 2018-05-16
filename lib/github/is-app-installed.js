module.exports = async (robot, repoId) => {
  const github = robot.auth();

  try {
    await github.request({
      method: 'GET',
      url: 'repositories/:reposiroy_id/installation',
      repository_id: repoId,
    });
  } catch (e) {
    return false;
  }
  return true;
};
