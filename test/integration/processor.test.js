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
    const logger = {
      error: jest.fn(),
    };
    const syncProcessor = processor(logger);

    processed = false;
    await syncProcessor(delay());
    expect(processed).toBeTruthy();
    expect(logger.error).not.toHaveBeenCalled();
  });

  test('processor is async when NODE_ENV is not "test"', async () => {
    process.env.NODE_ENV = '';
    const logger = {
      error: jest.fn(),
    };
    const asyncProcessor = processor(logger);

    processed = false;
    await asyncProcessor(delay());
    expect(processed).toBeFalsy();
    expect(logger.error).not.toHaveBeenCalled();
  });

  test('async error processing webhook', async () => {
    process.env.NODE_ENV = '';
    const logger = {
      error: jest.fn(),
    };
    const asyncProcessor = processor(logger);

    const err = new Error('This error is a test and is fine');
    const rejection = Promise.reject(err);
    await asyncProcessor(rejection);

    expect(logger.error).not.toHaveBeenCalledWith([err]);
  });
});
