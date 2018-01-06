module.exports = (req, res, next) => {
  if (req.body.type === 'url_verification') {
    res.send(req.body.challenge);
  } else {
    next();
  }
};
