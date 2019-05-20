import { Driver, Storage } from '@dynamico/driver';
import { pack } from 'tar-stream';
import zlib from 'zlib';
import express from 'express';
import streamToArray from 'stream-to-array';
import { Readable } from 'stream';
import streamEqual from 'stream-equal';
import { promisify } from 'util';
import * as controller from './controller';
import { InvalidVersionError } from './errors';

class MockStorage {
  saveComponent;
  getComponentTree;
  getIndex;
  upsertIndex;
  getComponent;
  constructor() {
    this.saveComponent = jest.fn();
    this.getComponentTree = jest.fn();
    this.getIndex = jest.fn();
    this.upsertIndex = jest.fn();
    this.getComponent = jest.fn();
  }
}

class MockDriver extends Driver {
  getComponent: jest.Mock;
  saveComponent: jest.Mock;
  constructor() {
    super(new MockStorage() as Storage);
    this.getComponent = jest.fn();
    this.saveComponent = jest.fn();
  }

  getFilesFromLatestSave() {
    // Last call to the mock, get the second argument.
    // meaning: driver.saveComponent(name, files <---- should return this)
    return this.saveComponent.mock.calls[this.saveComponent.mock.calls.length - 1][1];
  }
}

interface MockRequestParams {
  params?: any;
  query?: any;
  file?: any;
  body?: any;
}

const getMockRequest = ({ params, query, file, body }: MockRequestParams) => {
  return { params, query, file, body } as express.Request;
};

const getMockResponse = () => {
  return ({
    setHeader: jest.fn(),
    sendStatus: jest.fn(),
    json: jest.fn()
  } as unknown) as express.Response;
};

const asyncStreamEqual = promisify(streamEqual);
const stringToStream = contents => {
  const result = new Readable();
  result.push(contents);
  result.push(null);
  return result;
};

describe('controller', () => {
  describe('get', () => {
    it('throws error when component version is invalid', async () => {
      const mockDriver = new MockDriver();
      const response = getMockResponse();
      const invalidComponentVersion = 'invalidVersion';
      const query = {
        hostId: 'someId',
        componentVersion: invalidComponentVersion,
        latestComponentVersion: '0.0.2'
      };
      const params = { name: 'test' };
      const request = getMockRequest({ params, query });
      mockDriver.getComponent.mockReturnValueOnce({ version: 1, getCode: () => {} });

      await expect(controller.get(mockDriver)(request, response)).rejects.toEqual(
        new InvalidVersionError({ componentVersion: invalidComponentVersion })
      );
    });

    it('throws error when latest version is invalid', async () => {
      const mockDriver = new MockDriver();
      const response = getMockResponse();
      const invalidLatestVersion = 'invalidVersion';
      const query = {
        hostId: 'someId',
        componentVersion: '0.0.1',
        latestComponentVersion: invalidLatestVersion
      };
      const params = { name: 'test' };
      const request = getMockRequest({ params, query });
      mockDriver.getComponent.mockReturnValueOnce({ version: 1, getCode: () => {} });
      await expect(controller.get(mockDriver)(request, response)).rejects.toEqual(
        new InvalidVersionError({ latestVersion: invalidLatestVersion })
      );
    });

    it('should use driver to get component with parameters from query', async () => {
      const mockDriver = new MockDriver();
      const response = getMockResponse();

      const query = {
        hostId: 'someId',
        componentVersion: '0.0.1',
        latestComponentVersion: '0.0.2'
      };
      const params = { name: 'test' };
      const request = getMockRequest({ params, query });
      mockDriver.getComponent.mockReturnValueOnce({ version: 1, getCode: () => {} });
      await controller.get(mockDriver)(request, response);
      expect(mockDriver.getComponent).toHaveBeenCalledWith({
        name: params.name,
        hostId: query.hostId,
        version: query.componentVersion
      });
    });

    it('it should respond with 204 when latest version is the only available version', async () => {
      const mockDriver = new MockDriver();
      const response = getMockResponse();

      const query = {
        hostVersion: '1.0.0',
        componentVersion: '0.0.1',
        latestComponentVersion: '0.0.2'
      };
      const params = { name: 'test' };
      const request = getMockRequest({ params, query });
      mockDriver.getComponent.mockReturnValueOnce({
        version: query.latestComponentVersion,
        getCode: () => {}
      });

      await controller.get(mockDriver)(request, response);

      expect(response.sendStatus).toBeCalledWith(204);
    });

    it(`it should set header 'Dynamico-Component-Version' on response to the component version`, async () => {
      const mockDriver = new MockDriver();
      const response = getMockResponse();

      const query = {
        hostVersion: '1.0.0',
        componentVersion: '0.0.1',
        latestComponentVersion: '0.0.2'
      };
      const params = { name: 'test' };
      const request = getMockRequest({ params, query });
      mockDriver.getComponent.mockReturnValueOnce({ version: '1', getCode: () => {} });

      await controller.get(mockDriver)(request, response);

      expect(response.setHeader).toBeCalledWith('Dynamico-Component-Version', '1');
    });

    it('returns component if latest component version is missing', async () => {
      const mockDriver = new MockDriver();
      const response = getMockResponse();
      const getCode = jest.fn();

      const query = {
        hostVersion: '1.0.0',
        componentVersion: '0.0.1'
      };
      const params = { name: 'test' };
      const request = getMockRequest({ params, query });
      mockDriver.getComponent.mockReturnValueOnce({ version: '1', getCode });

      await controller.get(mockDriver)(request, response);

      expect(getCode).toBeCalled();
    });

    it('returns component if latest component version is different than found component version', async () => {
      const mockDriver = new MockDriver();
      const response = getMockResponse();
      const getCode = jest.fn();

      const query = {
        hostVersion: '1.0.0',
        componentVersion: '0.0.1',
        latestComponentVersion: '0.0.2'
      };
      const params = { name: 'test' };
      const request = getMockRequest({ params, query });
      const returnedVersion = `${query.latestComponentVersion}.1`;
      mockDriver.getComponent.mockReturnValueOnce({ version: returnedVersion, getCode });

      await controller.get(mockDriver)(request, response);

      expect(getCode).toBeCalled();
    });
  });

  describe('save', () => {
    it('throws error when component version is invalid', async () => {
      const mockDriver = new MockDriver();
      const invalidVersion = 'invalidVersion';
      const request = getMockRequest({
        params: { name: 'test', componentVersion: invalidVersion },
        body: { peerDependencies: JSON.stringify({ depA: '1.2.3' }) }
      });
      const response = getMockResponse();
      await expect(controller.save(mockDriver)(request, response)).rejects.toEqual(
        new InvalidVersionError({ componentVersion: invalidVersion })
      );
    });

    it('sends 201 response', async () => {
      const getRandomText = (): string =>
        Math.random()
          .toString(36)
          .substring(7);

      const createFile = (name: string): string => {
        const contents = getRandomText();

        tarPack.entry({ name }, contents);

        return contents;
      };
      const saveComponentResponse = { depA: 'some mismatches' };
      const mockDriver = new MockDriver();
      mockDriver.saveComponent.mockReturnValue(saveComponentResponse);
      const response = getMockResponse();

      const packageJsonFileName = 'package.json';
      const expectedIndexJsFilename = 'index.js';
      const indexJsFileName = `/${expectedIndexJsFilename}`;

      const tarPack = pack();
      const packageJsonContents = createFile(packageJsonFileName);
      const indexJsContents = createFile(indexJsFileName);
      tarPack.finalize();

      const buffer = (await streamToArray(tarPack.pipe(zlib.createGzip()))).reduce(
        (soFar, current) => Buffer.concat([soFar, current]),
        Buffer.from([])
      );

      const request = getMockRequest({
        params: { name: 'test', componentVersion: '0.0.1' },
        file: { buffer },
        body: { peerDependencies: JSON.stringify({ depA: '1.2.3' }) }
      });

      const expectedPackageJson = stringToStream(packageJsonContents);
      const expectedIndexJs = stringToStream(indexJsContents);

      await controller.save(mockDriver)(request, response);

      expect(response.json).toHaveBeenCalledWith(saveComponentResponse);

      const [pkgFile, indexFile] = mockDriver.getFilesFromLatestSave();

      expect(pkgFile.name).toBe(packageJsonFileName);
      expect(indexFile.name).toBe(expectedIndexJsFilename);

      await Promise.all([
        expect(asyncStreamEqual(pkgFile.stream, expectedPackageJson)).resolves.toBe(true),
        expect(asyncStreamEqual(indexFile.stream, expectedIndexJs)).resolves.toBe(true)
      ]);
    });
  });
});
