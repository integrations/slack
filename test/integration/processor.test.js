const processor = require('../../lib/activity/processor');

describe('Processor', () => {
  const { NODE_ENV } = process.env;
  let processed = false;

  function delay() {
    return new Promise((resolve) => {
      setTimeout(() => {
        processed = true;
        resolve();
      }, 100);
    });
  }

  afterEach(() => {
    process.env.NODE_ENV = NODE_ENV; // clean up the initial value
  });

  test('processor is sync when NODE_ENV is "test"', async () => {
    const syncProcessor = processor();

    processed = false;
    await syncProcessor(delay());
    expect(processed).toBeTruthy();
  });

  test('processor is async when NODE_ENV is not "test"', async () => {
    process.env.NODE_ENV = '';
    const asyncProcessor = processor();

    processed = false;
    await asyncProcessor(delay());
    expect(processed).toBeFalsy();
  });
});
