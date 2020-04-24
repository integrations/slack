function uniq(arr) {
  return [...new Set(arr)];
}

// Given expression +label:<value>
// `value` can be alphanumeric or a common special character
function labelValuePattern() {
  return /([A-Za-z0-9-:./\s]+)/;
}

// Given expression +reviewer:<value>
// `value` can be alphanumeric or a common special character
function reviewerValuePattern() {
  return /([A-Za-z0-9-:./\s]+)/;
}

// Allow alphanumerics and special characters and quoted spaces
// Example:
// label:foo label:teams/designers label:"foo bar" label:' bar baz'

function labelPattern() {
  return /(?:\+label:(?:([A-Za-z0-9-:./]+)|["']([A-Za-z0-9-:./\s]+)["']) ?)+$/g;
}

// Allow alphanumerics and special characters and quoted spaces
// Example:
// reviewer:foo reviewer:org/engineer reviewer:"foo bar" reviewer:' foo bar'
function reviewerPattern() {
  return /(?:\+reviewer:(?:([A-Za-z0-9-:./]+)|["']([A-Za-z0-9-:./\s]+)["']) ?)+$/g;
}

// We want to split on label with quoted spaces or on space and comma.
// label:foo label:"bar baz buzz" pulls issues, commits
// => ['label:foo', 'label:"bar baz buzz", pulls, issues, commits]
function splitPattern() {
  // TODO: consider deprecating comma as optional additional delimiter
  const pattern = /(\+label:".*?"|\+label:'.*?'|[^\s,]+)/g;
  return pattern;
}

function isProperLabelArg(arg) {
  return !!arg.match(labelPattern());
}

function isProperReviewerArg(arg) {
  return !!arg.match(reviewerPattern());
}

function extractLabelValue(arg) {
  const match = labelPattern().exec(arg);
  return match[1] || match[2];
}

function castInput(input) {
  if (input === undefined) {
    return [];
  } else if (Array.isArray(input)) {
    return input;
  }
  return Array(input);
}
function emptyResult() {
  return {
    features: [],
    required_labels: [],
    required_reviewers: [],
    invalids: [],
  };
}

function parseSettings(commandInput) {
  const commandArgs = castInput(commandInput);
  const init = emptyResult();

  const parsed = commandArgs.reduce((result, arg) => {
    if (arg.startsWith('+label')) {
      if (!isProperLabelArg(arg)) {
        const error = {
          raw: arg,
          key: '+label',
          val: arg.substr('+label:'.length),
        };
        return Object.assign(result, { invalids: result.invalids.concat(error) });
      }
      const value = extractLabelValue(arg);
      return Object.assign(result, { required_labels: result.required_labels.concat(value) });
    }

    if (arg.startsWith('+reviewer')) {
      if (!isProperReviewerArg(arg)) {
        const error = {
          raw: arg,
          key: '+reviewer',
          val: arg.substr('+reviewer:'.length),
        };
        return Object.assign(result, { invalids: result.invalids.concat(error) });
      }
      const value = extractLabelValue(arg);
      return Object.assign(result, { required_reviewers: result.required_reviewers.concat(value) });
    }

    return Object.assign(result, { features: result.features.concat(arg) });
  }, init);

  return {
    required_labels: uniq(parsed.required_labels),
    required_reviewers: uniq(parsed.required_reviewers),
    features: parsed.features,
    invalids: parsed.invalids,
    // NOTE: hasValue needs to be true even if all arguments are invalid
    // This ensures that we don't accidentally delete subscrptions based on the
    // absense of values in `features`, `required_labels`, and  `required_reviewers`.
    hasValues: [parsed.features, parsed.required_labels, parsed.required_reviewers, parsed.invalids]
      .some(arr => arr.length > 0),
  };
}

// parse raw command inputs into an object.
// +label:"wip" +label:"dont merge" pulls issues
// => {
//       required_labels: ["wip", "dont merge"],
//       features: ["pulls", "issues"],
//       invalids: [], hasValue: true
//    }
function parseSubscriptionArgString(argString) {
  const input = argString || '';
  const noResult = Object.assign(emptyResult(), { resource: null });

  const match = input.match(splitPattern());
  if (!match) {
    return noResult;
  }
  const [resource, ...settings] = match;
  const result = Object.assign(parseSettings(settings), { resource });
  return result;
}

// convert array to object
// [ {a: true}, {b: false}] => {a: true, b: false}
function arrayToObject(arr) {
  return arr.reduce((result, obj) => {
    const key = Object.keys(obj)[0];
    return Object.assign(result, { [key]: obj[key] });
  }, {});
}

// ['comments:all', 'issues'] => {comments: all, issues: true/false}
function parseFeatures(features, booleanContext) {
  if (features === undefined || booleanContext === undefined) {
    throw new Error('cannot parse data with missing required arguments.', {
      features,
      booleanContext,
    });
  }
  const featureList = features.map((feature) => {
    if (feature.includes(':')) {
      const [key, val] = feature.split(':');
      return { [key]: val };
    }
    return { [feature]: booleanContext };
  });
  return arrayToObject(featureList);
}

module.exports = {
  parseSettings,
  parseFeatures,
  parseSubscriptionArgString,
  labelPattern,
  reviewerPattern,
  labelValuePattern,
  reviewerValuePattern,
};
