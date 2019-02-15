const constants = require('./constants');

function arrayToFormattedString(array, key) {
  let output = '';
  if (array.length === 0) {
    return output;
  } else if (array.length === 1) {
    output = array[0][key];
    return output;
  }
  for (let i = 0; i < array.length; i += 1) {
    if (array.length - 1 !== i) {
      output += `${array[i][key]}, `;
    } else {
      output += array[i][key]; // last element should not have comma and space
    }
  }

  return output;
}

function getHexColorByState(state, merged = false, draft = false) {
  if (state === 'open') {
    return draft ? constants.DRAFT_GRAY : constants.OPEN_GREEN;
  } else if (state === 'closed' && merged === false) {
    return constants.CLOSED_RED;
  } else if (state === 'closed' && merged === true) {
    return constants.MERGED_PURPLE;
  }
}

function getStatusColor(status) {
  if (status === 'success') {
    return constants.STATUS_SUCCESS;
  } else if (status === 'pending') {
    return constants.STATUS_PENDING;
  } else if (status === 'failure' || status === 'error') {
    return constants.STATUS_FAILURE;
  }
}

module.exports = {
  arrayToFormattedString,
  getHexColorByState,
  getStatusColor,
};
