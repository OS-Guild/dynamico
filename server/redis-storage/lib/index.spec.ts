import { RedisIndexStorage } from '.';

class RedisClientMock {
  get;
  set;
  constructor() {
    this.get = jest.fn();
    this.set = jest.fn();
  }
}

describe('redis-index-storage', () => {
  describe('constructor', () => {
    it('should bind redis client to itself when created', () => {
      let get = () => {};
      let set = () => {};
      get.bind = jest.fn();
      set.bind = jest.fn();
      const redisClientMock = {
        get,
        set
      };

      new RedisIndexStorage(redisClientMock as any);

      expect(redisClientMock.get.bind).toBeCalledWith(redisClientMock);
      expect(redisClientMock.set.bind).toBeCalledWith(redisClientMock);
    });
  });

  describe('getIndex', () => {
    it('should return empty index when nothing returns from client', async () => {
      const redisClientMock = new RedisClientMock();
      redisClientMock.get.mockImplementationOnce((key: string, cb: (err, val) => void) => cb(null, null));
      const storage = new RedisIndexStorage(redisClientMock as any);

      const result = await storage.getIndex();

      expect(result).toEqual({});
    });

    it('should return parsed index when json returned from client', async () => {
      const redisClientMock = new RedisClientMock();
      const expectedResult = {
        'some host id': {
          components: {
            'some component': 'some version'
          },
          dependencies: {
            'some dependency': 'some version'
          }
        }
      };
      redisClientMock.get.mockImplementationOnce((key: string, cb: (err, val) => void) =>
        cb(null, JSON.stringify(expectedResult))
      );
      const storage = new RedisIndexStorage(redisClientMock as any);

      const result = await storage.getIndex();

      expect(result).toEqual(expectedResult);
    });

    it('should throw json parse error when invalid json is returned', async () => {
      const redisClientMock = new RedisClientMock();
      const storageResponse = '"';
      redisClientMock.get.mockImplementationOnce((key: string, cb: (err, val) => void) => cb(null, storageResponse));
      const storage = new RedisIndexStorage(redisClientMock as any);

      await expect(storage.getIndex()).rejects.toEqual(new SyntaxError('Unexpected end of JSON input'));
    });

    it('should use index as key name when non supplied', async () => {
      const redisClientMock = new RedisClientMock();
      let keyUsed;
      redisClientMock.get.mockImplementationOnce((key: string, cb: (err, val) => void) => {
        keyUsed = key;
        cb(null, null);
      });
      const storage = new RedisIndexStorage(redisClientMock as any);

      await storage.getIndex();

      expect(keyUsed).toEqual('index');
    });

    it('should use provided key name as key name when non supplied', async () => {
      const redisClientMock = new RedisClientMock();
      let keyUsed;
      const expectedKeyName = 'definitely not index';
      redisClientMock.get.mockImplementationOnce((key: string, cb: (err, val) => void) => {
        keyUsed = key;
        cb(null, null);
      });
      const storage = new RedisIndexStorage(redisClientMock as any, expectedKeyName);

      await storage.getIndex();

      expect(keyUsed).toEqual(expectedKeyName);
    });

    it('should call get to retrieve index', async () => {
      const redisClientMock = new RedisClientMock();
      redisClientMock.get.mockImplementationOnce((key: string, cb: (err, val) => void) => cb(null, null));
      const storage = new RedisIndexStorage(redisClientMock as any);

      await storage.getIndex();

      expect(redisClientMock.get).toBeCalled();
    });
  });

  describe('upsertIndex', () => {
    it('should call set to upsert index', async () => {
      const redisClientMock = new RedisClientMock();
      const index = {};
      redisClientMock.set.mockImplementationOnce((key: string, value: string, cb: (err, val) => void) =>
        cb(null, null)
      );
      const storage = new RedisIndexStorage(redisClientMock as any);

      await storage.upsertIndex(index);

      expect(redisClientMock.set).toBeCalled();
    });

    it('should call set with JSON.stringified index', async () => {
      const redisClientMock = new RedisClientMock();
      const index = {
        'some host id': {
          components: {
            'some component': 'some version'
          },
          dependencies: {
            'some dependency': 'some version'
          }
        }
      };
      let savedValue;
      redisClientMock.set.mockImplementationOnce((key: string, value: string, cb: (err, val) => void) => {
        savedValue = value;
        cb(null, null);
      });
      const storage = new RedisIndexStorage(redisClientMock as any);

      await storage.upsertIndex(index);

      expect(savedValue).toEqual(JSON.stringify(index));
    });

    it('should upsert index to key name index when non is provided', async () => {
      const redisClientMock = new RedisClientMock();
      const index = {
        'some host id': {
          components: {
            'some component': 'some version'
          },
          dependencies: {
            'some dependency': 'some version'
          }
        }
      };
      let keyUsedToSave;
      redisClientMock.set.mockImplementationOnce((key: string, value: string, cb: (err, val) => void) => {
        keyUsedToSave = key;
        cb(null, null);
      });
      const storage = new RedisIndexStorage(redisClientMock as any);

      await storage.upsertIndex(index);

      expect(keyUsedToSave).toEqual('index');
    });

    it('should upsert index to provided key name when one is provided', async () => {
      const redisClientMock = new RedisClientMock();
      const index = {
        'some host id': {
          components: {
            'some component': 'some version'
          },
          dependencies: {
            'some dependency': 'some version'
          }
        }
      };
      const expectedKeyName = 'definitely not index';
      let keyUsedToSave;
      redisClientMock.set.mockImplementationOnce((key: string, value: string, cb: (err, val) => void) => {
        keyUsedToSave = key;
        cb(null, null);
      });
      const storage = new RedisIndexStorage(redisClientMock as any, expectedKeyName);

      await storage.upsertIndex(index);

      expect(keyUsedToSave).toEqual(expectedKeyName);
    });
  });
});
