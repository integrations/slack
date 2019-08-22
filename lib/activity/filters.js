const shouldFilterByLabel = (subscription, issue) => {
  if (issue === undefined) {
    return false;
  }

  if (!Array.isArray(issue.labels)) {
    return false;
  }

  if (subscription.settings.required_labels === undefined) {
    return false;
  }

  if (Array.isArray(subscription.settings.required_labels)
    && subscription.settings.required_labels.length === 0) {
    return false;
  }

  return true;
};

module.exports = {
  shouldFilterByLabel,
};
