function arrayToFormattedString(array, key) {
  let output = '';
  if (array.length == 0) {
    return output
  } else if (array.length == 1) {
    output = array[0][key]
    return output
  } else {
    for (let i=0; i<array.length; i++) {
      if (array.length - 1 != i) {
        output += `${array[i][key]}, `
      } else {
        output += array[i][key] //last element should not have comma and space
      }
    }
  }
  return output
}

module.exports = {
  arrayToFormattedString,
}
