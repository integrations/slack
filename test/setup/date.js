const now = new Date('2017-11-27T14:33:42Z');
Date.now = jest.fn().mockReturnValue(now);
