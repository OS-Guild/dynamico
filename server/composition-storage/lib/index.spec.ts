import { CompositionStorage } from './';
import { IndexStorage, ComponentsStorage } from '@dynamico/common-types';
import { Index } from '@dynamico/common-types';

class MockIndexStorage implements IndexStorage {
  getIndex: any = jest.fn();
  upsertIndex: any = jest.fn();
}

class MockComponentsStorage implements ComponentsStorage {
  getComponentTree: any = jest.fn();
  getComponent: any = jest.fn();
  saveComponent: any = jest.fn();
}
describe('CompositionStorage', () => {
  describe('getIndex', () => {
    it('Should proxy call to index storage', async () => {
      const mockIndexStorage = new MockIndexStorage();
      const mockComponentsStorage = new MockComponentsStorage();
      const storage = new CompositionStorage(mockIndexStorage, mockComponentsStorage);
      const expected = 'expected';
      mockIndexStorage.getIndex.mockReturnValueOnce(Promise.resolve(expected));

      const result = await storage.getIndex();

      expect(result).toEqual(expected);
      expect(mockIndexStorage.getIndex).toBeCalled();
      expect(mockIndexStorage.upsertIndex).not.toBeCalled();
      expect(mockComponentsStorage.getComponent).not.toBeCalled();
      expect(mockComponentsStorage.getComponentTree).not.toBeCalled();
      expect(mockComponentsStorage.saveComponent).not.toBeCalled();
    });
  });

  describe('upsertIndex', () => {
    it('Should proxy call to index storage', async () => {
      const mockIndexStorage = new MockIndexStorage();
      const mockComponentsStorage = new MockComponentsStorage();
      const storage = new CompositionStorage(mockIndexStorage, mockComponentsStorage);
      const expected: Index = {
        something: {
          components: {},
          dependencies: {}
        }
      };
      const mockInputIndex: Index = {
        somthingElse: {
          components: {},
          dependencies: {}
        }
      };
      mockIndexStorage.upsertIndex.mockReturnValueOnce(Promise.resolve(expected));

      const result = await storage.upsertIndex(mockInputIndex);

      expect(result).toEqual(expected);
      expect(mockIndexStorage.upsertIndex).toBeCalledWith(mockInputIndex);
      expect(mockIndexStorage.getIndex).not.toBeCalled();
      expect(mockComponentsStorage.getComponent).not.toBeCalled();
      expect(mockComponentsStorage.getComponentTree).not.toBeCalled();
      expect(mockComponentsStorage.saveComponent).not.toBeCalled();
    });
  });

  describe('getComponent', () => {
    it('Should proxy call to components storage', async () => {
      const mockIndexStorage = new MockIndexStorage();
      const mockComponentsStorage = new MockComponentsStorage();
      const storage = new CompositionStorage(mockIndexStorage, mockComponentsStorage);
      const mockComponentName = 'some component';
      const mockComponentVersion = 'some version';
      const expectedReturnValue = {
        name: mockComponentName,
        version: mockComponentVersion,
        getCode: () => 'something'
      };
      mockComponentsStorage.getComponent.mockReturnValueOnce(expectedReturnValue);

      const result = await storage.getComponent(mockComponentName, mockComponentVersion);

      expect(result).toEqual(expectedReturnValue);
      expect(mockComponentsStorage.getComponent).toBeCalledWith(mockComponentName, mockComponentVersion);
      expect(mockIndexStorage.upsertIndex).not.toBeCalled();
      expect(mockIndexStorage.getIndex).not.toBeCalled();
      expect(mockComponentsStorage.getComponentTree).not.toBeCalled();
      expect(mockComponentsStorage.saveComponent).not.toBeCalled();
    });
  });

  describe('getComponentTree', () => {
    it('Should proxy call to components storage', async () => {
      const mockIndexStorage = new MockIndexStorage();
      const mockComponentsStorage = new MockComponentsStorage();
      const storage = new CompositionStorage(mockIndexStorage, mockComponentsStorage);
      const mockComponentName = 'some component';
      const mockComponentVersion = 'some version';
      const expectedReturnValue = {
        [mockComponentName]: {
          [mockComponentVersion]: () => 'something'
        }
      };
      mockComponentsStorage.getComponentTree.mockReturnValueOnce(expectedReturnValue);

      const result = await storage.getComponentTree();

      expect(result).toEqual(expectedReturnValue);
      expect(mockComponentsStorage.getComponentTree).toBeCalled();
      expect(mockIndexStorage.upsertIndex).not.toBeCalled();
      expect(mockIndexStorage.getIndex).not.toBeCalled();
      expect(mockComponentsStorage.getComponent).not.toBeCalled();
      expect(mockComponentsStorage.saveComponent).not.toBeCalled();
    });
  });

  describe('saveComponent', () => {
    it('Should proxy call to components storage', async () => {
      const mockIndexStorage = new MockIndexStorage();
      const mockComponentsStorage = new MockComponentsStorage();
      const storage = new CompositionStorage(mockIndexStorage, mockComponentsStorage);
      const mockComponentName = 'some component';
      const mockComponentVersion = 'some version';
      const mockComponent = {
        name: mockComponentName,
        version: mockComponentVersion
      };
      const files = ['some', 'files'];
      mockComponentsStorage.saveComponent.mockReturnValueOnce(Promise.resolve());

      await storage.saveComponent(mockComponent, files as any);

      expect(mockComponentsStorage.saveComponent).toBeCalledWith(mockComponent, files);
      expect(mockComponentsStorage.getComponentTree).not.toBeCalled();
      expect(mockIndexStorage.upsertIndex).not.toBeCalled();
      expect(mockIndexStorage.getIndex).not.toBeCalled();
      expect(mockComponentsStorage.getComponent).not.toBeCalled();
    });
  });
});
