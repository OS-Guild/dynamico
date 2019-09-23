import { DynamicoClient } from './Client';
import { ComponentGetFailedError, ComponentIntegrityCheckFailed } from './errors';
class MockStorageProvider {
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

const testIssue = {
  version: '1.0.0',
  mismatches: {}
};

describe('Client tests', () => {
  let consoleWarnSpy;
  beforeEach(() => (consoleWarnSpy = jest.spyOn(global.console, 'warn')));
  afterEach(() => consoleWarnSpy.mockRestore());

  describe('constructor', () => {
    afterEach(() => {
      global['fetch'] = undefined;
      global['window'] = undefined;
    });

    it('uses global fetch when there is one defined', () => {
      const bind = jest.fn();
      global['fetch'] = {
        bind
      };
      global['window'] = {};
      new DynamicoClient({
        url: 'testUrl',
        cache: new MockStorageProvider(),
        dependencies: {
          resolvers: {},
          versions: {}
        }
      });
      expect(bind).toBeCalled();
    });
    it('throws error when no fetcher is available', () => {
      expect(
        () =>
          new DynamicoClient({
            url: 'testUrl',
            cache: new MockStorageProvider(),
            dependencies: {
              resolvers: {},
              versions: {}
            }
          })
      ).toThrow();
    });
  });

  describe('get', () => {
    describe('initialize', () => {
      it('throws error when registration request fails', async () => {
        const url = 'testUrl';
        const versions = {};
        const mockFetch = jest.fn();
        const expectedError = new Error('test error');
        mockFetch.mockRejectedValue(expectedError);

        const mockStroageController = new MockStorageProvider();

        const client = new DynamicoClient({
          url,
          cache: mockStroageController,
          dependencies: {
            resolvers: {},
            versions
          },
          fetcher: mockFetch as GlobalFetch['fetch']
        });
        await expect(client.get('some component')).rejects.toEqual(expectedError);
      });

      it('does not register dependency and warns about it when only a resolver is provided', async () => {
        const url = 'testUrl';
        const versions = {
          depA: '1.0.0'
        };
        const nonVersionedDep = 'nonVersionedDep';
        const resolvers = Object.entries(versions).reduce(
          (soFar, [key, version]) => ({ ...soFar, [key]: () => `${key}@${version}` }),
          {}
        );
        resolvers[nonVersionedDep] = () => `${'nonVersionedDep'}`;
        const request = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(versions)
        };
        const mockFetch = jest.fn();
        const mockResponse = {
          json: () => Promise.resolve({ id: 'test_id', issues, index: {} }),
          ok: true
        };
        const issues = {
          testComponent: testIssue
        };

        mockFetch.mockReturnValueOnce(Promise.resolve(mockResponse)).mockReturnValueOnce(
          Promise.resolve({
            text: () => Promise.resolve('true'),
            headers: {
              get: () => 'test_header'
            },
            status: 200,
            ok: true
          })
        );
        const mockStroageController = new MockStorageProvider();

        const client = new DynamicoClient({
          url,
          cache: mockStroageController,
          dependencies: {
            resolvers,
            versions
          },
          fetcher: mockFetch as GlobalFetch['fetch']
        });
        await client.get('some component');

        expect(mockFetch).toBeCalledWith(`${url}/host/register`, request);
        expect(consoleWarnSpy).toHaveBeenCalledWith(`Missing version specifier for ${nonVersionedDep}`);
      });

      it('does not register dependency when a resolver is not provided for that dependency', async () => {
        const url = 'testUrl';
        const nonResolvedDep = 'nonResolvedDep';
        const resolvedDep = 'resolvedDep';
        const versions = {
          [nonResolvedDep]: '1.0.0',
          [resolvedDep]: '2.0.0'
        };
        const resolvers = { [resolvedDep]: () => 'test dependency' };
        const expectedVersions = {
          [resolvedDep]: '2.0.0'
        };
        const request = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(expectedVersions)
        };
        const mockFetch = jest.fn();
        const mockResponse = {
          json: () => Promise.resolve({ id: 'test_id', issues, index: {} }),
          ok: true
        };
        const issues = {
          testComponent: testIssue
        };
        mockFetch.mockReturnValueOnce(Promise.resolve(mockResponse)).mockReturnValueOnce(
          Promise.resolve({
            text: () => Promise.resolve('true'),
            headers: {
              get: () => 'test_header'
            },
            status: 200,
            ok: true
          })
        );
        const mockStroageController = new MockStorageProvider();

        const client = new DynamicoClient({
          url,
          cache: mockStroageController,
          dependencies: {
            resolvers,
            versions
          },
          fetcher: mockFetch as GlobalFetch['fetch']
        });
        await client.get('some component');

        expect(mockFetch).toBeCalledWith(`${url}/host/register`, request);
      });

      it('gets component code when registration responds with success', async () => {
        const url = 'testUrl';
        const versions = {};
        const componentName1 = 'test component';
        const componentName2 = 'another test component';
        const hostId = 'test_id';
        const request = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(versions)
        };
        const mockFetch = jest.fn();
        const mockRegisterResponse = {
          json: () => Promise.resolve({ id: hostId, issues: { testComponent: testIssue }, index: {} }),
          ok: true
        };

        const mockGetComponentResponse = {
          text: () => Promise.resolve('true'),
          headers: {
            get: () => 'test_header'
          },
          status: 200,
          ok: true
        };
        const client = new DynamicoClient({
          url,
          cache: new MockStorageProvider(),
          dependencies: {
            resolvers: {},
            versions
          },
          fetcher: mockFetch as GlobalFetch['fetch']
        });
        mockFetch
          .mockImplementationOnce(() => {
            client.get(componentName2);
            return Promise.resolve(mockRegisterResponse);
          })
          .mockImplementationOnce(() => Promise.resolve(mockGetComponentResponse))
          .mockImplementationOnce(() => Promise.resolve(mockGetComponentResponse));

        await client.get(componentName1);

        expect(mockFetch).toBeCalledWith(`${url}/host/register`, request);
        expect(mockFetch).toBeCalledWith(`${url}/${componentName1}?hostId=${hostId}`);
        expect(mockFetch).toBeCalledWith(`${url}/${componentName2}?hostId=${hostId}`);
      });

      it('prints out warning when registration response contains issues', async () => {
        const url = 'testUrl';
        const componentName = 'test component';
        const dependencyName = 'test dependency';
        const hostMismatchVersion = 'host version';
        const componentMismatchVersion = 'component version';
        const hostId = 'test_id';
        const versions = {};

        const request = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(versions)
        };

        const issues = {
          [componentName]: {
            ...testIssue,
            mismatches: {
              [dependencyName]: {
                host: hostMismatchVersion,
                component: componentMismatchVersion
              }
            }
          }
        };

        const mockRegisterResponse = {
          json: () => Promise.resolve({ id: hostId, issues, index: {} }),
          ok: true
        };

        const mockGetComponentResponse = {
          text: () => Promise.resolve('true'),
          headers: {
            get: () => 'test_header'
          },
          status: 200,
          ok: true
        };

        const mockFetch = jest.fn();
        mockFetch
          .mockReturnValueOnce(Promise.resolve(mockRegisterResponse))
          .mockReturnValueOnce(Promise.resolve(mockGetComponentResponse));

        const mockStroageController = new MockStorageProvider();

        const client = new DynamicoClient({
          url,
          cache: mockStroageController,
          dependencies: {
            resolvers: {},
            versions
          },
          fetcher: mockFetch as GlobalFetch['fetch']
        });
        await client.get(componentName);

        expect(mockFetch).toBeCalledWith(`${url}/host/register`, request);
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          `${componentName}@${
            issues[componentName].version
          } requires ${dependencyName}@${componentMismatchVersion} but host provides ${hostMismatchVersion}. Please consider upgrade to version ${componentMismatchVersion}`
        );
        expect(mockFetch).toBeCalledWith(`${url}/${componentName}?hostId=${hostId}`);
      });
    });

    it('sends component version and component name to server when component version is specified and cache is empty', async () => {
      const url = 'testUrl';
      const componentName = 'component_test';
      const componentVersion = 'version_test';
      const prefix = 'test';
      const versions = {};
      const mockFetch = jest.fn();
      const mockResponse = {
        text: () => Promise.resolve('true'),
        headers: {
          get: () => 'test_header'
        },
        status: 200,
        ok: true
      };

      const mockRegisterResponse = {
        json: () => Promise.resolve({ id: '' }),
        ok: true
      };

      mockFetch
        .mockReturnValueOnce(Promise.resolve(mockRegisterResponse))
        .mockReturnValueOnce(Promise.resolve(mockResponse));

      const mockStroageController = new MockStorageProvider();

      const client = new DynamicoClient({
        prefix,
        url,
        cache: mockStroageController,
        dependencies: {
          resolvers: {},
          versions
        },
        fetcher: mockFetch as GlobalFetch['fetch']
      });
      await client.get(componentName, { componentVersion });

      expect(mockFetch).toBeCalledWith(`${url}/${componentName}?hostId=&componentVersion=${componentVersion}`);
    });

    it('sends component name to server when component name and getLatest is specified', async () => {
      const url = 'testUrl';
      const componentName = 'component_test';
      const componentVersion = 'version_test';
      const prefix = 'test';
      const versions = {};
      const mockFetch = jest.fn();
      const mockResponse = {
        text: () => Promise.resolve('true'),
        headers: {
          get: () => 'test_header'
        },
        status: 200,
        ok: true
      };

      const mockRegisterResponse = {
        json: () => Promise.resolve({ id: '', issues: {}, index: {} }),
        ok: true
      };

      mockFetch
        .mockReturnValueOnce(Promise.resolve(mockRegisterResponse))
        .mockReturnValueOnce(Promise.resolve(mockResponse));

      const mockStroageController = new MockStorageProvider();
      mockStroageController[`${prefix}/${componentName}/${componentVersion}`] = 'new code';

      const client = new DynamicoClient({
        prefix,
        url,
        cache: mockStroageController,
        dependencies: {
          resolvers: {},
          versions
        },
        fetcher: mockFetch as GlobalFetch['fetch']
      });
      await client.get(componentName, { getLatest: true, componentVersion });

      expect(mockFetch).toBeCalledWith(`${url}/${componentName}?hostId=`);
    });

    it('gets component code from cache when component version is specified and a component by the same name exists in cache', async () => {
      const url = 'testUrl';
      const componentName = 'component_test';
      const componentVersion = 'version_test';
      const prefix = 'test';
      const versions = {};
      const mockFetch = jest.fn();
      const mockResponse = {
        text: () => Promise.resolve('true'),
        headers: {
          get: () => 'test_header'
        },
        status: 200,
        ok: true
      };

      const mockRegisterResponse = {
        json: () => Promise.resolve({ id: '', issues: {}, index: {} }),
        ok: true
      };

      mockFetch
        .mockReturnValueOnce(Promise.resolve(mockRegisterResponse))
        .mockReturnValueOnce(Promise.resolve(mockResponse));

      const mockStroageProvider = new MockStorageProvider();
      mockStroageProvider[`${prefix}/${componentName}/${componentVersion}`] = 'new code';

      const client = new DynamicoClient({
        prefix,
        url,
        cache: mockStroageProvider,
        dependencies: {
          resolvers: {},
          versions
        },
        fetcher: mockFetch as GlobalFetch['fetch']
      });
      await client.get(componentName, { componentVersion });

      expect(mockStroageProvider.getItem).toBeCalledWith(`${prefix}/${componentName}/${componentVersion}`);
    });

    it('should get component code from cache when component name exists in index and exists in cache', async () => {
      const url = 'testUrl';
      const componentName = 'component_test';
      const componentVersion = 'version_test';
      const hostId = '1';
      const prefix = 'test';
      const versions = {};
      const request = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(versions)
      };
      const mockFetch = jest.fn();
      const mockResponse = {
        text: () => Promise.resolve('true'),
        headers: {
          get: () => 'test_header'
        },
        status: 200,
        ok: true
      };

      const mockRegisterResponse = {
        json: () => Promise.resolve({ id: hostId, issues: {}, index: { [componentName]: componentVersion } }),
        ok: true
      };

      mockFetch
        .mockReturnValueOnce(Promise.resolve(mockRegisterResponse))
        .mockReturnValueOnce(Promise.resolve(mockResponse));

      const mockStroageProvider = new MockStorageProvider();
      mockStroageProvider[`${prefix}/${componentName}/${componentVersion}`] = 'new code';

      const client = new DynamicoClient({
        prefix,
        url,
        cache: mockStroageProvider,
        dependencies: {
          resolvers: {},
          versions
        },
        fetcher: mockFetch as GlobalFetch['fetch']
      });

      await client.get(componentName);

      expect(mockFetch).toBeCalledWith(`${url}/host/register`, request);
      expect(mockFetch).not.toBeCalledWith(`${url}/${componentName}?hostId=${hostId}`);
      expect(mockStroageProvider.getItem).toBeCalledWith(`${prefix}/${componentName}/${componentVersion}`);
    });

    it('should get component code from server when component name exists in index and does not exists in cache', async () => {
      const url = 'testUrl';
      const componentName = 'component_test';
      const componentVersion = 'version_test';
      const hostId = '1';
      const prefix = 'test';
      const versions = {};
      const request = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(versions)
      };
      const mockFetch = jest.fn();
      const mockResponse = {
        text: () => Promise.resolve('true'),
        headers: {
          get: () => 'test_header'
        },
        status: 200,
        ok: true
      };

      const mockRegisterResponse = {
        json: () => Promise.resolve({ id: hostId, issues: {}, index: { [componentName]: componentVersion } }),
        ok: true
      };

      mockFetch
        .mockReturnValueOnce(Promise.resolve(mockRegisterResponse))
        .mockReturnValueOnce(Promise.resolve(mockResponse));

      const mockStroageProvider = new MockStorageProvider();

      const client = new DynamicoClient({
        prefix,
        url,
        cache: mockStroageProvider,
        dependencies: {
          resolvers: {},
          versions
        },
        fetcher: mockFetch as GlobalFetch['fetch']
      });

      await client.get(componentName);

      expect(mockFetch).toBeCalledWith(`${url}/host/register`, request);
      expect(mockFetch).toBeCalledWith(`${url}/${componentName}?hostId=${hostId}&componentVersion=${componentVersion}`);
    });

    it('should get component code from server when component name does not exists in index and componentVersion is not specified', async () => {
      const url = 'testUrl';
      const componentName = 'component_test';
      const componentVersion = 'version_test';
      const hostId = '1';
      const prefix = 'test';
      const versions = {};
      const request = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(versions)
      };
      const mockFetch = jest.fn();
      const mockResponse = {
        text: () => Promise.resolve('true'),
        headers: {
          get: () => 'test_header'
        },
        status: 200,
        ok: true
      };

      const mockRegisterResponse = {
        json: () => Promise.resolve({ id: hostId, issues: {}, index: {} }),
        ok: true
      };

      mockFetch
        .mockReturnValueOnce(Promise.resolve(mockRegisterResponse))
        .mockReturnValueOnce(Promise.resolve(mockResponse));

      const mockStroageProvider = new MockStorageProvider();

      const client = new DynamicoClient({
        prefix,
        url,
        cache: mockStroageProvider,
        dependencies: {
          resolvers: {},
          versions
        },
        fetcher: mockFetch as GlobalFetch['fetch']
      });

      await client.get(componentName);

      expect(mockFetch).toBeCalledWith(`${url}/host/register`, request);
      expect(mockFetch).toBeCalledWith(`${url}/${componentName}?hostId=${hostId}`);
    });

    it('saves new component code to cache when status code is 200', async () => {
      const url = 'testUrl';
      const componentName = 'component_test';
      const componentVersion = 'version_test';
      const prefix = 'test';
      const testCode = `var a = "test code"`;
      const versions = {};
      const mockFetch = jest.fn();
      const mockResponse = {
        text: () => Promise.resolve(testCode),
        headers: {
          get: () => componentVersion
        },
        status: 200,
        ok: true
      };

      const mockRegisterResponse = {
        json: () => Promise.resolve({ id: '', issues: {}, index: {} }),
        ok: true
      };

      mockFetch
        .mockReturnValueOnce(Promise.resolve(mockRegisterResponse))
        .mockReturnValueOnce(Promise.resolve(mockResponse));

      const mockStroageProvider = new MockStorageProvider();

      const client = new DynamicoClient({
        prefix,
        url,
        cache: mockStroageProvider,
        dependencies: {
          resolvers: {},
          versions
        },
        fetcher: mockFetch as GlobalFetch['fetch']
      });
      await client.get(componentName);

      expect(mockStroageProvider.setItem).toBeCalledWith(`${prefix}/${componentName}/${componentVersion}`, testCode);
    });

    it('throws error when status code if response.ok is false', async () => {
      const url = 'testUrl';
      const componentName = 'component_test';
      const componentVersion = 'version_test';
      const prefix = 'test';
      const testCode = `var a = "test code"`;
      const versions = {};
      const mockFetch = jest.fn();
      const statusText = 'test error';
      const mockResponse = {
        text: () => Promise.resolve(testCode),
        headers: {
          get: () => componentVersion
        },
        status: 300,
        statusText,
        ok: false
      };

      const mockRegisterResponse = {
        json: () => Promise.resolve({ id: '', issues: {}, index: {} }),
        ok: true
      };

      mockFetch
        .mockReturnValueOnce(Promise.resolve(mockRegisterResponse))
        .mockReturnValueOnce(Promise.resolve(mockResponse));

      const mockStroageProvider = new MockStorageProvider();

      const client = new DynamicoClient({
        prefix,
        url,
        cache: mockStroageProvider,
        dependencies: {
          resolvers: {},
          versions
        },
        fetcher: mockFetch as GlobalFetch['fetch']
      });
      await expect(client.get(componentName)).rejects.toEqual(
        new ComponentGetFailedError(statusText, mockResponse as any)
      );
    });

    it('throws error when component integrity check fails', async () => {
      const url = 'testUrl';
      const componentName = 'component_test';
      const componentVersion = 'version_test';
      const prefix = 'test';
      const testCode = `var a = "test code"`;
      const versions = {};
      const mockFetch = jest.fn();
      const mockGetComponentResponse = {
        text: () => Promise.resolve(testCode),
        headers: {
          get: () => componentVersion
        },
        status: 200,
        ok: true
      };

      const mockRegisterResponse = {
        json: () => Promise.resolve({ id: '', issues: {}, index: {} }),
        ok: true
      };

      mockFetch
        .mockReturnValueOnce(Promise.resolve(mockRegisterResponse))
        .mockReturnValueOnce(Promise.resolve(mockGetComponentResponse));

      const mockStroageProvider = new MockStorageProvider();

      const client = new DynamicoClient({
        prefix,
        url,
        cache: mockStroageProvider,
        dependencies: {
          resolvers: {},
          versions
        },
        fetcher: mockFetch as GlobalFetch['fetch'],
        checkCodeIntegrity: async (code: string) => false
      });
      try {
        await client.get(componentName);
      } catch (error) {
        const expectedError = new ComponentIntegrityCheckFailed({
          name: componentName,
          version: componentVersion
        } as any);
        expect(error.message).toEqual(expectedError.message);
        expect(error.data).toEqual(expectedError.data);
      }
    });

    it(`doesn't save to cache when status code if response.ok is false`, async () => {
      const url = 'testUrl';
      const componentName = 'component_test';
      const componentVersion = 'version_test';
      const prefix = 'test';
      const testCode = `var a = "test code"`;
      const versions = {};
      const mockFetch = jest.fn();
      const statusText = 'test error';
      const mockResponse = {
        text: () => Promise.resolve(testCode),
        headers: {
          get: () => componentVersion
        },
        status: 300,
        statusText,
        ok: false
      };

      const mockRegisterResponse = {
        json: () => Promise.resolve({ id: '', issues: {}, index: {} }),
        ok: true
      };

      mockFetch
        .mockReturnValueOnce(Promise.resolve(mockRegisterResponse))
        .mockReturnValueOnce(Promise.resolve(mockResponse));

      const mockStroageProvider = new MockStorageProvider();

      const client = new DynamicoClient({
        prefix,
        url,
        cache: mockStroageProvider,
        dependencies: {
          resolvers: {},
          versions
        },
        fetcher: mockFetch as GlobalFetch['fetch']
      });
      try {
        await client.get(componentName);
      } catch {
        expect(mockStroageProvider.setItem).not.toBeCalled();
      }
    });

    it('adds host id to request when initialized', async () => {
      const url = 'testUrl';
      const componentName = 'component_test';
      const componentVersion = 'version_test';
      const prefix = 'test';
      const expectedHostId = 'test_id';
      const versions = {};
      const mockFetch = jest.fn();

      const issues = {
        testComponent: testIssue
      };

      const mockRegisterResponse = {
        json: () => Promise.resolve({ id: expectedHostId, issues, index: {} })
      };

      const mockGetComponentResponse = {
        text: () => Promise.resolve('true'),
        headers: {
          get: () => 'test_header'
        },
        status: 200,
        ok: true
      };
      mockFetch
        .mockReturnValueOnce(Promise.resolve(mockRegisterResponse))
        .mockReturnValueOnce(Promise.resolve(mockGetComponentResponse));

      const mockStroageController = new MockStorageProvider();
      mockStroageController[`${prefix}/${componentName}/${componentVersion}`] = 'new code';

      const client = new DynamicoClient({
        prefix,
        url,
        cache: mockStroageController,
        dependencies: {
          resolvers: {},
          versions
        },
        fetcher: mockFetch as GlobalFetch['fetch']
      });

      await client.get(componentName);

      expect(mockFetch).toBeCalledWith(`${url}/${componentName}?hostId=${expectedHostId}`);
    });

    it('exposes dependency when provided in constructor', async () => {
      const url = 'testUrl';
      const componentName = 'component_test';
      const componentVersion = 'version_test';
      const prefix = 'test';
      const testCode = `require('dep')()`;
      const dep = jest.fn();
      const versions = { dep: '1.0.0' };
      const mockFetch = jest.fn();
      const mockResponse = {
        text: () => Promise.resolve(testCode),
        headers: {
          get: () => componentVersion
        },
        status: 200,
        ok: true
      };

      const mockRegisterResponse = {
        json: () => Promise.resolve({ id: '', issues: {}, index: {} }),
        ok: true
      };

      mockFetch
        .mockReturnValueOnce(Promise.resolve(mockRegisterResponse))
        .mockReturnValueOnce(Promise.resolve(mockResponse));

      const mockStroageProvider = new MockStorageProvider();

      const client = new DynamicoClient({
        prefix,
        url,
        cache: mockStroageProvider,
        dependencies: {
          resolvers: {
            dep
          },
          versions
        },
        fetcher: mockFetch as GlobalFetch['fetch']
      });
      await client.get(componentName);

      expect(dep).toBeCalled();
    });

    it('exposes globals when provided in constructor', async () => {
      const url = 'testUrl';
      const componentName = 'component_test';
      const componentVersion = 'version_test';
      const prefix = 'test';
      const someGlobal = jest.fn();
      const testCode = `someGlobal()`;
      const mockFetch = jest.fn();
      const mockResponse = {
        text: () => Promise.resolve(testCode),
        headers: {
          get: () => componentVersion
        },
        status: 200,
        ok: true
      };

      const mockRegisterResponse = {
        json: () => Promise.resolve({ id: '', issues: {}, index: {} }),
        ok: true
      };

      mockFetch
        .mockReturnValueOnce(Promise.resolve(mockRegisterResponse))
        .mockReturnValueOnce(Promise.resolve(mockResponse));

      const mockStroageProvider = new MockStorageProvider();

      const client = new DynamicoClient({
        prefix,
        url,
        cache: mockStroageProvider,
        dependencies: {
          resolvers: {},
          versions: {}
        },
        globals: {
          someGlobal
        },
        fetcher: mockFetch as GlobalFetch['fetch']
      });
      await client.get(componentName);

      expect(someGlobal).toBeCalled();
    });

    it('overrides globals from ctor when provided in get options', async () => {
      const url = 'testUrl';
      const componentName = 'component_test';
      const componentVersion = 'version_test';
      const prefix = 'test';
      const ctorGlobal = jest.fn();
      const getGlobal = jest.fn();
      const testCode = `someGlobal()`;
      const mockFetch = jest.fn();
      const mockResponse = {
        text: () => Promise.resolve(testCode),
        headers: {
          get: () => componentVersion
        },
        status: 200,
        ok: true
      };

      const mockRegisterResponse = {
        json: () => Promise.resolve({ id: '', issues: {}, index: {} }),
        ok: true
      };

      mockFetch
        .mockReturnValueOnce(Promise.resolve(mockRegisterResponse))
        .mockReturnValueOnce(Promise.resolve(mockResponse));

      const mockStroageProvider = new MockStorageProvider();

      const client = new DynamicoClient({
        prefix,
        url,
        cache: mockStroageProvider,
        dependencies: {
          resolvers: {},
          versions: {}
        },
        globals: {
          someGlobal: ctorGlobal
        },
        fetcher: mockFetch as GlobalFetch['fetch']
      });
      await client.get(componentName, {
        globals: { someGlobal: getGlobal }
      });

      expect(getGlobal).toBeCalled();
      expect(ctorGlobal).not.toBeCalled();
    });

    it('evaluates and returns module export when fetched code uses module.exports form and ignores exports.default', async () => {
      const url = 'testUrl';
      const componentName = 'component_test';
      const componentVersion = 'version_test';
      const prefix = 'test';
      const moduleExportsValue = 'test module.exports';
      const exportsDefaultValue = 'should not be this';
      const testCode = `
      exports.default = '${exportsDefaultValue}';
        module.exports = '${moduleExportsValue}';`;

      const mockFetch = jest.fn();
      const mockResponse = {
        text: () => Promise.resolve(testCode),
        headers: {
          get: () => componentVersion
        },
        status: 200,
        ok: true
      };

      const mockRegisterResponse = {
        json: () => Promise.resolve({ id: '', issues: {}, index: {} }),
        ok: true
      };

      mockFetch
        .mockReturnValueOnce(Promise.resolve(mockRegisterResponse))
        .mockReturnValueOnce(Promise.resolve(mockResponse));

      const mockStroageProvider = new MockStorageProvider();

      const client = new DynamicoClient({
        prefix,
        url,
        cache: mockStroageProvider,
        dependencies: {
          resolvers: {},
          versions: {}
        },
        fetcher: mockFetch as GlobalFetch['fetch']
      });
      const result = await client.get(componentName);

      expect(result).toEqual(moduleExportsValue);
    });

    it('evaluates and returns exports.default when fetched code uses exports.default and not module.exports', async () => {
      const url = 'testUrl';
      const componentName = 'component_test';
      const componentVersion = 'version_test';
      const prefix = 'test';

      const exportsDefaultValue = 'test exports.default';
      const testCode = `
      exports.default = '${exportsDefaultValue}';`;

      const mockFetch = jest.fn();
      const mockResponse = {
        text: () => Promise.resolve(testCode),
        headers: {
          get: () => componentVersion
        },
        status: 200,
        ok: true
      };

      const mockRegisterResponse = {
        json: () => Promise.resolve({ id: '', issues: {}, index: {} }),
        ok: true
      };

      mockFetch
        .mockReturnValueOnce(Promise.resolve(mockRegisterResponse))
        .mockReturnValueOnce(Promise.resolve(mockResponse));

      const mockStroageProvider = new MockStorageProvider();

      const client = new DynamicoClient({
        prefix,
        url,
        cache: mockStroageProvider,
        dependencies: {
          resolvers: {},
          versions: {}
        },
        fetcher: mockFetch as GlobalFetch['fetch']
      });
      const result = await client.get(componentName);

      expect(result).toEqual(exportsDefaultValue);
    });
  });
});
