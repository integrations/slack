const shouldFilterByLabel = (subscription, issue) => {
  if (issue === undefined) {
    return false;
  }

  if (!Array.isArray(issue.labels)) {
    return false;
  }

  if (subscription.settings.label === undefined) {
    return false;
  }

  if (Array.isArray(subscription.settings.label) && subscription.settings.label.length === 0) {
    return false;
  }

  return true;
};

module.exports = {
  shouldFilterByLabel,
};
