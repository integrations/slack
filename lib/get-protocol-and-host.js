module.exports = req => ({
  protocol: req.headers['x-forwarded-proto'] || req.protocol,
  host: req.headers['x-forwarded-host'] || req.get('host'),
});
