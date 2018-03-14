module.exports = req => /api\.slack\.com/.test(req.headers['user-agent']);
