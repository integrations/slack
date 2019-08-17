const _ = require('lodash');

function labelValuePattern() {
  return /([A-Za-z0-9-:./\s]+)/;
}

function labelPattern() {
  return /(?:label:(?:([A-Za-z0-9-:./]+)|["']([A-Za-z0-9-:./\s]+)["']) ?)+$/g;
}

function splitPattern() {
  // TODO: consider deprecating comma as optional additional delimiter
  const pattern = /(label:".*?"|label:'.*?'|[^\s,]+)/g;
  return pattern;
}

function isProperLabelArg(arg) {
  return !!arg.match(labelPattern());
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
  return { features: [], labels: [], invalids: [] };
}

function parseSettings(commandInput) {
  const commandArgs = castInput(commandInput);
  const init = emptyResult();

  const parsed = commandArgs.reduce((result, arg) => {
    if (arg.startsWith('label')) {
      if (!isProperLabelArg(arg)) {
        const error = {
          raw: arg,
          key: 'label',
          val: arg.substr('label:'.length),
        };
        return Object.assign(result, { invalids: result.invalids.concat(error) });
      }
      const value = extractLabelValue(arg);
      return Object.assign(result, { labels: result.labels.concat(value) });
    }
    return Object.assign(result, { features: result.features.concat(arg) });
  }, init);

  return {
    // TODO: do we want to sort?
    // labels: _.uniq(parsed.labels.sort()),
    labels: _.uniq(parsed.labels),
    features: parsed.features,
    invalids: parsed.invalids,
    hasValues: parsed.features.length > 0 || parsed.labels.length > 0,
  };
}

function parseSubscriptionArgString(argString) {
  const input = argString || '';
  const noResult = Object.assign(emptyResult(), { resource: null });

  const match = input.match(splitPattern());
  if (!match) {
    return noResult;
  }
  const [resource, ...settings] = match;
  const result = Object.assign(parseSettings(settings), { resource });
  // TODO: where do we get the boolean context from? (enable vs disable)
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
    console.log(features);
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
    // FIXME OH NO :( this is a bug. Its True or False, depending on the context
    return { [feature]: booleanContext };
  });
  return arrayToObject(featureList);
}

// labels: ['foo', 'bar'], features: [comments: 'all', issues: boolean]
// => { features: [...], label: [...]}
function mergeLabelsAndFeatures(labels, features) {
  const merged = labels.length ? Object.assign(features, { label: labels }) : features;
  return merged;
}
function ensureValidSettings(settings) {
  if (settings.invalids.length) {
    const firstError = settings.invalids[0];
    invalidFeatureValueFailure(firstError.key, firstError.val);
  }
}

module.exports = {
  parseSettings,
  parseFeatures,
  mergeLabelsAndFeatures,
  parseSubscriptionArgString,
  labelPattern,
  labelValuePattern,
};
