const arr = [1, 2, 3, 4]
function processChunk() {
  console.log('chunk');
  if (arr.length === 0) {
    // code that runs after the whole array is executed
    console.log('done');
  } else {
    // pick 100 items and remove them from the array
    const subarr = arr.splice(0, 2)
    for (const item of subarr) {
      // do heavy stuff for each item on the array
      console.log({ item });
    }
    // Put the function back in the queue
    process.nextTick(processChunk)
  }
}
processChunk()
