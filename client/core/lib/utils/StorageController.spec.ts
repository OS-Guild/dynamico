import { StorageController } from './StorageController';

class MockStorage {
  clear;
  getItem = jest.fn();
  setItem;
  removeItem;
  key;
  length;
  constructor() {
    this.getItem = jest.fn();
    this.setItem = jest.fn();
  }
}

describe('StorageControllerTests', () => {
  describe('getStorageKey', () => {
    it('returns storage key with prefix when providing component name and version', () => {
      const storageController = new StorageController('test_prefix', new MockStorage());
      const key = storageController.getStorageKey('component_test', 'version_test');
      expect(key).toMatch(/^test_prefix/);
    });

    it('returns different keys when using different component names', () => {
      const storageController = new StorageController('test_prefix', new MockStorage());
      const key1 = storageController.getStorageKey('component_test_a', 'version_test');
      const key2 = storageController.getStorageKey('component_test_b', 'version_test');
      expect(key1).not.toEqual(key2);
    });

    it('returns different keys when using different component versions', () => {
      const storageController = new StorageController('test_prefix', new MockStorage());
      const key1 = storageController.getStorageKey('component_test_a', 'version_test_1');
      const key2 = storageController.getStorageKey('component_test_a', 'version_test_2');
      expect(key1).not.toEqual(key2);
    });
  });

  describe('has', () => {
    it('returns false when storage is empty', () => {
      const storageController = new StorageController('test', new MockStorage());
      const has = storageController.has('component_test', 'version_test');
      expect(has).toBe(false);
    });

    it('returns true for component that exists in storage', () => {
      const componentName = 'component_test';
      const componentVersion = 'version_test';
      const prefix = 'test';
      const mockStorage = new MockStorage();
      mockStorage[`${prefix}/${componentName}/${componentVersion}`] = 'my component';
      const storageController = new StorageController(prefix, mockStorage);
      const has = storageController.has(componentName, componentVersion);

      expect(has).toBe(true);
    });
  });

  describe('getItem', () => {
    it('retrieves component from storage by key when provided existing component name and version', async () => {
      const componentName = 'component_test';
      const componentVersion = 'version_test';
      const prefix = 'test';
      const mockStorage = new MockStorage();
      const componentCode = 'test code';
      mockStorage.getItem.mockReturnValue(componentCode);

      const storageController = new StorageController(prefix, mockStorage);
      const result = await storageController.getItem(componentName, componentVersion);
      const key = storageController.getStorageKey(componentName, componentVersion);
      expect(mockStorage.getItem).toHaveBeenCalledWith(key);
      expect(result).toEqual(componentCode);
    });
  });

  describe('setItem', () => {
    it('saves component code to storage by key when code and component name and version are provided', async () => {
      const componentName = 'component_test';
      const componentVersion = 'version_test';
      const prefix = 'test';
      const mockStorage = new MockStorage();
      mockStorage.setItem.mockReturnValue(Promise.resolve());
      const componentCode = 'test code';
      const storageController = new StorageController(prefix, mockStorage);
      await storageController.setItem(componentName, componentVersion, componentCode);
      const key = storageController.getStorageKey(componentName, componentVersion);
      expect(mockStorage.setItem).toBeCalledWith(key, componentCode);
    });
  });

  describe('getLatestVersion', () => {
    it('returns the latest version number when there are more than one version available', () => {
      const componentName = 'component_test';
      const earlierVersion = '0.0.1';
      const latestVersion = '1.0.0';
      const prefix = 'test';
      const mockStorage = new MockStorage();
      mockStorage[`${prefix}/${componentName}/${earlierVersion}`] = 'old code';
      mockStorage[`${prefix}/${componentName}/${latestVersion}`] = 'new code';

      const storageController = new StorageController(prefix, mockStorage);
      const result = storageController.getLatestVersion(componentName);

      expect(result).not.toEqual(earlierVersion);
      expect(result).toEqual(latestVersion);
    });
    it('returns undefined for empty storage', () => {
      const componentName = 'component_test';
      const prefix = 'test';
      const mockStorage = new MockStorage();

      const storageController = new StorageController(prefix, mockStorage);
      const result = storageController.getLatestVersion(componentName);

      expect(result).not.toBeDefined();
    });
  });
});
