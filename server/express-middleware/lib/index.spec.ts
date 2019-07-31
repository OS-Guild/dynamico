import controllerBuilder from '.';

describe('index', () => {
  describe('constructor', () => {
    it('should use router arguments when provided', async () => {
      const mockRouter = {
        get: jest.fn(),
        post: jest.fn(),
        use: jest.fn()
      };

      controllerBuilder({} as any, { router: mockRouter as any });

      expect(mockRouter.get).toBeCalledTimes(1);
      expect(mockRouter.post).toBeCalledTimes(2);
      expect(mockRouter.use).toBeCalledTimes(1);
    });
    it('should not set up more than one post route and not call use when set to readOnly', () => {
      const mockRouter = {
        get: jest.fn(),
        post: jest.fn(),
        use: jest.fn()
      };

      controllerBuilder({} as any, { readOnly: true, router: mockRouter as any });

      expect(mockRouter.get).toBeCalledTimes(1);
      expect(mockRouter.post).toBeCalledTimes(1);
      expect(mockRouter.use).not.toBeCalled();
    });
  });
});
