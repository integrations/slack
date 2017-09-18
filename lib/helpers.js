const constants = require('./constants');

function arrayToFormattedString(array, key) {
  let output = '';
  if (array.length === 0) {
    return output;
  } else if (array.length === 1) {
    output = array[0][key];
    return output;
  } else {
    for (let i = 0; i < array.length; i += 1) {
      if (array.length - 1 !== i) {
        output += `${array[i][key]}, `;
      } else {
        output += array[i][key]; // last element should not have comma and space
      }
    }
  }
  return output;
}

function getHexColorbyState(state, merged = false) {
  if (state === 'open') {
    return constants.OPEN_GREEN;
  } else if (state === 'closed' && merged === false) {
    return constants.CLOSED_RED;
  } else if (state === 'closed' && merged === true) {
    return constants.MERGED_PURPLE;
  }
}

function getFormattedState(state, merged = false) {
  if (state === 'open') {
    return ':green_heart: Open';
  } else if (state === 'closed' && merged === false) {
    return ':heart: Closed';
  } else if (state === 'closed' && merged === true) {
    return ':purple_heart: Merged';
  }
}

function getStatusColor(status) {
  if (status === 'success') {
    return '#28a745';
  } else if (status === 'pending') {
    return '#dbab09';
  } else if (status === 'failure' || status === 'error') {
    return '#cb2431';
  }
}

module.exports = {
  arrayToFormattedString,
  getHexColorbyState,
  getFormattedState,
  getStatusColor,
};
