import * as azureBlobStorageMocks from '@azure/storage-blob';
import toString from 'stream-to-string';
import { AzureBlobStorage } from '.';
import { FailedIndexUpsert } from './errors';
import intoStream = require('into-stream');

describe('AzureBlobStorage', () => {
  const createBlobMock = (path: string, contents: string) => {
    const mockedResult = { readableStreamBody: { read: () => contents }, contentLength: 2 };
    const blobUrl = {
      download: jest.fn().mockResolvedValueOnce(mockedResult)
    };
    (azureBlobStorageMocks as any).addBlockBlobUrlMock(path.toLowerCase(), blobUrl);
    return blobUrl;
  };

  describe('getIndex', () => {
    afterEach(() => (azureBlobStorageMocks as any).clearMocks());

    it('should download index file when getting index', async () => {
      const expectedIndex = {
        'some-host-id': { 'some-component': 'some-version' }
      };
      const indexBlobName = 'some index file name';
      const blobUrl = createBlobMock(indexBlobName, JSON.stringify(expectedIndex));

      const storage = new AzureBlobStorage({
        container: {} as any,
        indexBlobName
      });

      const result = await storage.getIndex();
      expect(blobUrl.download).toBeCalled();
      expect(result).toEqual(expectedIndex);
    });

    it('should return empty object when error with status code 404 is thrown', async () => {
      const indexBlobName = 'some index file name';
      const blobUrl = {
        download: jest.fn().mockRejectedValueOnce({ statusCode: 404 })
      };
      (azureBlobStorageMocks as any).addBlockBlobUrlMock(indexBlobName, blobUrl);

      const storage = new AzureBlobStorage({
        container: {} as any,
        indexBlobName
      });

      const result = await storage.getIndex();
      expect(blobUrl.download).toBeCalled();
      expect(result).toEqual({});
    });

    it('should throw the raw error when no status code is present on error', async () => {
      const indexBlobName = 'some index file name';
      const expectedError = new Error('some error');
      const blobUrl = {
        download: jest.fn().mockRejectedValueOnce(expectedError)
      };
      (azureBlobStorageMocks as any).addBlockBlobUrlMock(indexBlobName, blobUrl);

      const storage = new AzureBlobStorage({
        container: {} as any,
        indexBlobName
      });
      await expect(storage.getIndex()).rejects.toEqual(expectedError);
      expect(blobUrl.download).toBeCalled();
    });

    it('should throw the raw error when status code is different than 404', async () => {
      const indexBlobName = 'some index file name';
      const expectedError = { statusCode: 'definitely not 404' };
      const blobUrl = {
        download: jest.fn().mockRejectedValueOnce(expectedError)
      };
      (azureBlobStorageMocks as any).addBlockBlobUrlMock(indexBlobName, blobUrl);

      const storage = new AzureBlobStorage({
        container: {} as any,
        indexBlobName
      });
      await expect(storage.getIndex()).rejects.toEqual(expectedError);
      expect(blobUrl.download).toBeCalled();
    });
  });

  describe('upsertIndex', () => {
    afterEach(() => (azureBlobStorageMocks as any).clearMocks());

    it('should get current index and extend it', async () => {
      const existingIndex = {
        'some-host-id': { 'some-component': 'some-version' }
      };
      const newIndex = {
        'a-different-host-id': {
          components: { 'another component': 'some other version' },
          dependencies: { 'some-dependency': 'some dep version' }
        }
      };
      const indexBlobName = 'some index file name';
      const mockedResult = { readableStreamBody: { read: () => JSON.stringify(existingIndex) }, contentLength: 2 };
      const blobUrl = {
        indexBlobName,
        download: jest.fn().mockResolvedValueOnce(mockedResult)
      };

      const uploaderMock = jest.fn().mockResolvedValueOnce(undefined);
      (azureBlobStorageMocks as any).addBlockBlobUrlMock(indexBlobName, blobUrl);
      (azureBlobStorageMocks as any).addUploadStreamToBlockBlobMocks(indexBlobName, uploaderMock);
      const storage = new AzureBlobStorage({
        container: {} as any,
        indexBlobName
      });

      await storage.upsertIndex(newIndex);
      expect(blobUrl.download).toBeCalled();
      expect(uploaderMock).toBeCalled();
      const stream = uploaderMock.mock.calls[0][1];
      const result = JSON.parse(await toString(stream));
      const expectedNewIndex = { ...existingIndex, ...newIndex };
      expect(result).toEqual(expectedNewIndex);
    });

    it('should get current index and override existing entries', async () => {
      const existingIndex = {
        'some-host-id': { 'some-component': 'some-version' }
      };
      const newIndex = {
        'some-host-id': {
          components: { 'another component': 'some other version' },
          dependencies: { 'some-dependency': 'some dep version' }
        }
      };
      const indexBlobName = 'some index file name';
      const mockedResult = { readableStreamBody: { read: () => JSON.stringify(existingIndex) }, contentLength: 2 };
      const blobUrl = {
        indexBlobName,
        download: jest.fn().mockResolvedValueOnce(mockedResult)
      };

      const uploaderMock = jest.fn().mockResolvedValueOnce(undefined);
      (azureBlobStorageMocks as any).addBlockBlobUrlMock(indexBlobName, blobUrl);
      (azureBlobStorageMocks as any).addUploadStreamToBlockBlobMocks(indexBlobName, uploaderMock);
      const storage = new AzureBlobStorage({
        container: {} as any,
        indexBlobName
      });

      await storage.upsertIndex(newIndex);
      expect(blobUrl.download).toBeCalled();
      expect(uploaderMock).toBeCalled();
      const stream = uploaderMock.mock.calls[0][1];
      const result = JSON.parse(await toString(stream));
      const expectedNewIndex = { ...existingIndex, ...newIndex };
      expect(result).toEqual(expectedNewIndex);
    });

    it('should throw FailedIndexUpsert error with index and thrown error when index download throws', async () => {
      const newIndex = {
        'some-host-id': {
          components: { 'another component': 'some other version' },
          dependencies: { 'some-dependency': 'some dep version' }
        }
      };
      const indexBlobName = 'some index file name';
      const someError = new Error('some error');
      const expectedError = new FailedIndexUpsert(someError, newIndex);

      const blobUrl = {
        indexBlobName,
        download: jest.fn().mockRejectedValueOnce(someError)
      };

      const uploaderMock = jest.fn().mockResolvedValueOnce(undefined);
      (azureBlobStorageMocks as any).addBlockBlobUrlMock(indexBlobName, blobUrl);
      (azureBlobStorageMocks as any).addUploadStreamToBlockBlobMocks(indexBlobName, uploaderMock);
      const storage = new AzureBlobStorage({
        container: {} as any,
        indexBlobName
      });

      await expect(storage.upsertIndex(newIndex)).rejects.toEqual(expectedError);
      expect(blobUrl.download).toBeCalled();
      expect(uploaderMock).not.toBeCalled();
    });

    it('should throw FailedIndexUpsert error with index and thrown error when index upload throws', async () => {
      const existingIndex = {
        'some-host-id': { 'some-component': 'some-version' }
      };
      const newIndex = {
        'some-host-id': {
          components: { 'another component': 'some other version' },
          dependencies: { 'some-dependency': 'some dep version' }
        }
      };
      const indexBlobName = 'some index file name';
      const mockedResult = { readableStreamBody: { read: () => JSON.stringify(existingIndex) }, contentLength: 2 };
      const blobUrl = {
        indexBlobName,
        download: jest.fn().mockResolvedValueOnce(mockedResult)
      };
      const someError = new Error('some error');
      const expectedError = new FailedIndexUpsert(someError, newIndex);

      const uploaderMock = jest.fn().mockRejectedValueOnce(someError);
      (azureBlobStorageMocks as any).addBlockBlobUrlMock(indexBlobName, blobUrl);
      (azureBlobStorageMocks as any).addUploadStreamToBlockBlobMocks(indexBlobName, uploaderMock);
      const storage = new AzureBlobStorage({
        container: {} as any,
        indexBlobName
      });

      await expect(storage.upsertIndex(newIndex)).rejects.toEqual(expectedError);
      expect(blobUrl.download).toBeCalled();
      expect(uploaderMock).toBeCalled();
    });
  });

  describe('getComponentTree', () => {
    const indexBlobName = 'some index file name';
    beforeEach(() => {
      const expectedIndex = {
        'some-host-id': { 'some-component': 'some-version' }
      };
      createBlobMock(indexBlobName, JSON.stringify(expectedIndex));
    });

    afterEach(() => (azureBlobStorageMocks as any).clearMocks());

    it('should return empty object when listing container returns undefined', async () => {
      const container: any = {
        listBlobFlatSegment: jest.fn().mockResolvedValueOnce(undefined)
      };
      const storage = new AzureBlobStorage({
        container,
        indexBlobName
      });

      const tree = await storage.getComponentTree();
      expect(tree).toEqual({});
    });

    it('should return empty object when listing container returns empty object', async () => {
      const container: any = {
        listBlobFlatSegment: jest.fn().mockResolvedValueOnce({})
      };
      const storage = new AzureBlobStorage({
        container,
        indexBlobName
      });

      const tree = await storage.getComponentTree();
      expect(tree).toEqual({});
    });

    it('should return empty object when listing container returns empty segment property', async () => {
      const container: any = {
        listBlobFlatSegment: jest.fn().mockResolvedValueOnce({ segment: {} })
      };
      const storage = new AzureBlobStorage({
        container,
        indexBlobName
      });

      const tree = await storage.getComponentTree();
      expect(tree).toEqual({});
    });

    it('should return empty object when listing container returns segment property with 0 blob items', async () => {
      const container: any = {
        listBlobFlatSegment: jest.fn().mockResolvedValueOnce({ segment: { blobItems: [] } })
      };
      const storage = new AzureBlobStorage({
        container,
        indexBlobName
      });

      const tree = await storage.getComponentTree();
      expect(tree).toEqual({});
    });

    it('should continue listing as long as there is a nextMarker property on the response', async () => {
      const firstResponse = { segment: { blobItems: [{ name: 'componentA/1.0.0' }] }, nextMarker: 'some marker' };
      const container: any = {
        listBlobFlatSegment: jest.fn().mockResolvedValueOnce(firstResponse)
      };
      const secondResponse = { segment: { blobItems: [{ name: 'componentA/2.0.0' }] }, nextMarker: 'another marker' };
      container.listBlobFlatSegment.mockResolvedValueOnce(secondResponse);
      const lastResponse = { segment: { blobItems: [{ name: 'componentA/3.0.0' }] } };
      container.listBlobFlatSegment.mockResolvedValueOnce(lastResponse);
      const storage = new AzureBlobStorage({
        container,
        indexBlobName
      });

      await storage.getComponentTree();
      expect(container.listBlobFlatSegment).toBeCalledTimes(3);
    });

    it('should return object with entry for every component version with package.json', async () => {
      const componentA = 'componentA';
      const componentB = 'componentB';
      const firstResponse = {
        segment: { blobItems: [{ name: `${componentA}/1.0.0/package.json` }] },
        nextMarker: 'some marker'
      };
      const container: any = {
        listBlobFlatSegment: jest.fn().mockResolvedValueOnce(firstResponse)
      };
      const secondResponse = {
        segment: {
          blobItems: [{ name: `${componentA}/2.0.0/package.json` }, { name: `${componentB}/2.0.0/package.json` }]
        },
        nextMarker: 'another marker'
      };
      container.listBlobFlatSegment.mockResolvedValueOnce(secondResponse);
      const lastResponse = {
        segment: {
          blobItems: [
            { name: `${componentA}/3.0.0/package.json` },
            { name: `${componentB}/1.0.0/package.json` },
            { name: `${componentB}/4.0.0/not_package_json` }
          ]
        }
      };
      container.listBlobFlatSegment.mockResolvedValueOnce(lastResponse);
      const storage = new AzureBlobStorage({
        container,
        indexBlobName
      });

      const tree = await storage.getComponentTree();
      const componentNames = Object.keys(tree);
      expect(componentNames).toContain(componentA);
      expect(componentNames).toContain(componentB);

      const componentAVersions = Object.keys(tree[componentA]);
      expect(componentAVersions).toContain('1.0.0');
      expect(componentAVersions).toContain('2.0.0');
      expect(componentAVersions).toContain('3.0.0');

      const componentBVersions = Object.keys(tree[componentB]);
      expect(componentBVersions).toContain('1.0.0');
      expect(componentBVersions).toContain('2.0.0');
      expect(componentBVersions).not.toContain('4.0.0');
    });

    it('should return object with entry for every component version with package.json with function that returns peerDependencies', async () => {
      const componentA = 'componenta';
      const componentB = 'componentb';
      const firstResponse = {
        segment: { blobItems: [{ name: `${componentA}/1.0.0/package.json` }] },
        nextMarker: 'some marker'
      };
      const container: any = {
        listBlobFlatSegment: jest.fn().mockResolvedValueOnce(firstResponse)
      };
      const secondResponse = {
        segment: {
          blobItems: [{ name: `${componentA}/2.0.0/package.json` }, { name: `${componentB}/2.0.0/package.json` }]
        },
        nextMarker: 'another marker'
      };
      container.listBlobFlatSegment.mockResolvedValueOnce(secondResponse);
      const lastResponse = {
        segment: {
          blobItems: [
            { name: `${componentA}/3.0.0/package.json` },
            { name: `${componentB}/1.0.0/package.json` },
            { name: `${componentB}/4.0.0/not_package_json` }
          ]
        }
      };
      container.listBlobFlatSegment.mockResolvedValueOnce(lastResponse);
      const storage = new AzureBlobStorage({
        container,
        indexBlobName
      });

      const tree = await storage.getComponentTree();
      const packageJson = { peerDependencies: { someDep: 'som version' } };

      createBlobMock(`${componentA}/1.0.0/package.json`, JSON.stringify(packageJson));
      const result = await tree[componentA]['1.0.0']();

      expect(result).toEqual(packageJson.peerDependencies);
    });
  });

  describe('getComponent', () => {
    const indexBlobName = 'some index file name';

    beforeEach(() => {
      const expectedIndex = {
        'some-host-id': { 'some-component': 'some-version' }
      };
      createBlobMock(indexBlobName, JSON.stringify(expectedIndex));
    });

    afterEach(() => (azureBlobStorageMocks as any).clearMocks());

    it('should return object with component name and version', async () => {
      const componentName = 'componentA';
      const componentVersion = 'component_version';
      const storage = new AzureBlobStorage({
        container: {} as any,
        indexBlobName
      });
      createBlobMock(`${componentName}/${componentVersion}/package.json`, JSON.stringify({ main: 'filename' }));
      const component = await storage.getComponent(componentName, componentVersion);
      expect(component).toBeDefined();
      expect(component!.name).toEqual(componentName);
      expect(component!.version).toEqual(componentVersion);
    });

    it('should return object with function that downloads code blob', async () => {
      const componentName = 'componentA';
      const componentVersion = 'component_version';
      const filename = 'filename';
      const code = 'some code';
      const storage = new AzureBlobStorage({
        container: {} as any,
        indexBlobName
      });
      createBlobMock(`${componentName}/${componentVersion}/package.json`, JSON.stringify({ main: filename }));
      createBlobMock(`${componentName}/${componentVersion}/${filename}`, code);
      const component = await storage.getComponent(componentName, componentVersion);
      expect(component).toBeDefined();
      await expect(component!.getCode()).resolves.toEqual(code);
    });
  });

  describe('saveComponent', () => {
    const indexBlobName = 'some index file name';

    beforeEach(() => {
      const expectedIndex = {
        'some-host-id': { 'some-component': 'some-version' }
      };
      createBlobMock(indexBlobName, JSON.stringify(expectedIndex));
    });

    it('should not try to upload when there are no files to save', async () => {
      const storage = new AzureBlobStorage({
        container: {} as any,
        indexBlobName
      });
      const component = {
        name: 'some component',
        version: 'some version'
      };
      const uploadMock = jest.fn();
      (azureBlobStorageMocks as any).addUploadStreamToBlockBlobMocks(
        `${component.name}/${component.version}/package.json`,
        uploadMock
      );
      await storage.saveComponent(component, []);
      expect(uploadMock).not.toBeCalled();
    });

    it('should throw error when there is no package.json file to save', async () => {
      const storage = new AzureBlobStorage({
        container: {} as any,
        indexBlobName
      });
      const expectedError = new Error('Missing package.json file');
      const component = {
        name: 'some component',
        version: 'some version'
      };
      const uploadMock = jest.fn();
      (azureBlobStorageMocks as any).addUploadStreamToBlockBlobMocks(
        `${component.name}/${component.version}/package.json`,
        uploadMock
      );
      await expect(
        storage.saveComponent(component, [{ name: 'filename', stream: intoStream('stream data') }])
      ).rejects.toEqual(expectedError);
      expect(uploadMock).not.toBeCalled();
    });

    it('should upload files when package.json is present', async () => {
      const storage = new AzureBlobStorage({
        container: {} as any,
        indexBlobName
      });
      const fileContents = intoStream('package.json contents');
      const component = {
        name: 'some component',
        version: 'some version'
      };
      const uploadMock = jest.fn();
      const packageJsonPath = `${component.name}/${component.version}/package.json`;
      (azureBlobStorageMocks as any).addUploadStreamToBlockBlobMocks(packageJsonPath, uploadMock);
      (azureBlobStorageMocks as any).addBlockBlobUrlMock(packageJsonPath, { indexBlobName: packageJsonPath });
      await storage.saveComponent(component, [{ name: 'package.json', stream: fileContents }]);
      expect(uploadMock).toBeCalled();
      const streamData = uploadMock.mock.calls[0][1];
      expect(streamData).toEqual(fileContents);
    });
  });
});
