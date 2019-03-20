import { Driver, Storage, Component, VersionTree } from '.';
import { merge } from 'lodash';

const getCode = () => '';
const componentName = 'sheker';

type MemoryStorage = Record<string, VersionTree>;

interface TestCase {
  title: string;
  storage: MemoryStorage;
  requestedAppVersion: string;
  requestedComponentVersion?: string;
  expected: {
    result?: Component;
    error?: string;
  };
}

class MockStorage implements Storage {
  constructor(private components: MemoryStorage = {}) {}

  getComponentVersionTree = (name: string) => this.components[name] || {};
  saveComponent(component: Component, code: string) {
    this.components = merge({}, this.components, {
      [component.name]: {
        [component.appVersion]: {
          [component.version!]: () => code
        }
      }
    });
  }
}

describe('Driver', () => {
  const components: MemoryStorage = {
    [componentName]: {
      '1.0.0': {
        '0.0.0': getCode
      },
      '1.4.0': {
        '0.0.0': getCode,
        '1.0.0': getCode,
        '2.0.0': getCode
      },
      '2.15.0': {
        '0.0.0': getCode,
        '1.0.0': getCode,
        '2.0.0': getCode
      },
      '2.20.0': {
        '0.0.0': getCode
      }
    }
  };

  const testCases: TestCase[] = [
    {
      title: 'Request version higher than every version, get the latest version.',
      storage: components,
      requestedAppVersion: '3.0.0',
      requestedComponentVersion: '0.0.0',
      expected: {
        result: {
          name: componentName,
          appVersion: '2.20.0',
          version: '0.0.0'
        }
      }
    },
    {
      title: 'Request version higher than every version without component version, get the latest version.',
      storage: components,
      requestedAppVersion: '3.0.0',
      expected: {
        result: {
          name: componentName,
          appVersion: '2.20.0',
          version: '0.0.0'
        }
      }
    },
    {
      title: 'Request version higher than some versions, get the floor version.',
      storage: components,
      requestedAppVersion: '1.7.0',
      requestedComponentVersion: '0.0.0',
      expected: {
        result: {
          name: componentName,
          appVersion: '1.4.0',
          version: '2.0.0'
        }
      }
    },
    {
      title: 'Request version higher than some versions without component version, get the floor version.',
      storage: components,
      requestedAppVersion: '1.7.0',
      expected: {
        result: {
          name: componentName,
          appVersion: '1.4.0',
          version: '2.0.0'
        }
      }
    },
    {
      title: 'Request exact version, with exact component, get the exact match.',
      storage: components,
      requestedAppVersion: '1.4.0',
      requestedComponentVersion: '1.0.0',
      expected: {
        result: {
          name: componentName,
          appVersion: '1.4.0',
          version: '1.0.0'
        }
      }
    },
    {
      title: 'Request exact version, without exact component, get the exact match.',
      storage: components,
      requestedAppVersion: '1.4.0',
      expected: {
        result: {
          name: componentName,
          appVersion: '1.4.0',
          version: '2.0.0'
        }
      }
    },
    {
      title: 'Request version lower than every version, throw exception.',
      storage: components,
      requestedAppVersion: '0.4.0',
      requestedComponentVersion: '1.0.0',
      expected: {
        error: `No result for ${componentName} with app version: 0.4.0 and component version: 1.0.0`
      }
    },
    {
      title: 'Request version lower than every version without component version, throw exception.',
      storage: components,
      requestedAppVersion: '0.4.0',
      expected: {
        error: `No result for ${componentName} with app version: 0.4.0`
      }
    },
    {
      title: 'Request some version but the no versions exist in storage, throw exception.',
      storage: {},
      requestedAppVersion: '0.4.0',
      requestedComponentVersion: '1.0.0',
      expected: {
        error: `No result for ${componentName} with app version: 0.4.0 and component version: 1.0.0`
      }
    },
    {
      title: 'Request exact version but exact component does not exists, throw exception.',
      storage: merge({}, components, {
        [componentName]: {
          '2.20.0': {
            '2.0.0': getCode
          }
        }
      }),
      requestedAppVersion: '2.20.0',
      requestedComponentVersion: '1.0.0',
      expected: {
        error: `No result for ${componentName} with app version: 2.20.0 and component version: 1.0.0`
      }
    },
    {
      title: 'Request exact version but exact component does not exist, throw exception.',
      storage: {
        [componentName]: {
          '1.0.0': {
            '1.0.0': getCode
          }
        }
      },
      requestedAppVersion: '1.0.0',
      requestedComponentVersion: '0.0.0',
      expected: {
        error: `No result for ${componentName} with app version: 1.0.0 and component version: 0.0.0`
      }
    },
    {
      title: 'Request exact version but exact component is too high and does not exists, throw exception.',
      storage: merge({}, components, {
        [componentName]: {
          '2.20.0': {
            '2.0.0': getCode
          }
        }
      }),
      requestedAppVersion: '2.20.0',
      requestedComponentVersion: '3.0.0',
      expected: {
        error: `No result for ${componentName} with app version: 2.20.0 and component version: 3.0.0`
      }
    }
  ];

  testCases.forEach(({ title, storage, requestedAppVersion, requestedComponentVersion, expected }) => {
    test(title, () => {
      const mockedStorage = new MockStorage(storage);
      const driver = new Driver(mockedStorage);

      try {
        const component = driver.getComponent({
          name: componentName,
          appVersion: requestedAppVersion,
          version: requestedComponentVersion
        });

        if (expected.result) {
          expect(component.version).toBe(expected.result.version);
          expect(component.appVersion).toBe(expected.result.appVersion);
        }
      } catch (error) {
        const result = (<Error>error).message;

        expect(result).toBe(expected.error);
      }
    });
  });
});
