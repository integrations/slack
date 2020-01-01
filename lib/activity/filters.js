const shouldFilterByRequiredLabel = (subscription, issue) => {
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

const shouldFilterByIgnoredLabel = (subscription, issue) => {
  if (issue === undefined) {
    return false;
  }

  if (!Array.isArray(issue.labels)) {
    return false;
  }

  if (subscription.settings.ignored_labels === undefined) {
    return false;
  }

  if (Array.isArray(subscription.settings.ignored_labels)
      && subscription.settings.ignored_labels.length === 0) {
    return false;
  }

  return true;
};


module.exports = {
  shouldFilterByRequiredLabel,
  shouldFilterByIgnoredLabel,
};
