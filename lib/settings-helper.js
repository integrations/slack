const _ = require('lodash');

function labelValuePattern() {
  return /([A-Za-z0-9-:./ ]+)/;
}

function labelPattern() {
  return /(?:label:(?:([A-Za-z0-9-:./]+)|["']([A-Za-z0-9-:./ ]+)["']) ?)+$/g;
}

function splitPattern() {
  const pattern = /(label:".*?"|label:'.*?'|[^\s]+)/g;
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
    labels: _.uniq(parsed.labels.sort()),
    features: parsed.features,
    invalids: parsed.invalids,
  };
}

// convert array to object
// [ {a: true}, {b: false}] => {a: true, b: false}
function arrayToObject(arr) {
  return arr.reduce((result, obj) => {
    const key = Object.keys(obj)[0];
    return Object.assign(result, { [key]: obj[key] });
  }, {});
}

function parseFeatures(features) {
  const featureList = features.map((feature) => {
    if (feature.includes(':')) {
      const [key, val] = feature.split(':');
      return { [key]: val };
    }
    return { [feature]: true };
  });
  return arrayToObject(featureList);
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
  result.features = parseFeatures(result.features);
  console.log('Done parsing features ', result);
  return result;
}

module.exports = {
  parseSettings,
  parseSubscriptionArgString,
  labelPattern,
  labelValuePattern,
};
