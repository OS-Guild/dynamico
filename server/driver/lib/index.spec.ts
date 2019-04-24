import { merge } from 'lodash';
import { Stream } from 'stream';

import { Driver, Storage, Component, ComponentTree, File, ComponentGetter, Index, Maybe } from './';
import {
  NoComponentError,
  NoComponentVersionError,
  ComponentExistsError,
  NoPackageError,
  UnknownHostIdError
} from './errors';

const getCode = () => '';
const getDependencies = () => ({});
const componentName = 'foo';

class MockStorage implements Storage {
  constructor(private index: Index = {}, private components: ComponentTree = {}) {}

  getIndex(): Index {
    return this.index;
  }

  upsertIndex(index: Index): void {
    this.index = {
      ...this.index,
      ...index
    };
  }

  getComponentTree(): ComponentTree {
    return this.components;
  }

  getComponent(name: string, version: string): Maybe<ComponentGetter> {
    return { name, version, getCode };
  }

  saveComponent(component: Component, files: File[]) {
    this.components = merge({}, this.components, {
      [component.name]: {
        [component.version!]: () => 'some code'
      }
    });
  }
}

describe('Driver', () => {
  describe('getComponent', () => {
    it('should find specified component in the index', () => {
      const expected = {
        name: 'compA',
        version: '1.0.0',
        getCode
      };

      const hostId = 'id';

      const index: Index = {
        [hostId]: {
          dependencies: {},
          components: {
            [expected.name]: expected.version
          }
        }
      };

      const mockedStorage = new MockStorage(index, {});
      const driver = new Driver(mockedStorage);

      const component = driver.getComponent({
        hostId,
        name: expected.name
      });

      expect(component.version).toBe(expected.version);
      expect(component.getCode()).toBe(expected.getCode());
    });

    it('should return specified component version and ignore index', () => {
      const expected = {
        name: 'compA',
        version: '2.0.0',
        getCode
      };

      const mockedStorage = new MockStorage(
        {},
        {
          [expected.name]: {
            '1.0.0': getDependencies,
            [expected.version]: getDependencies
          }
        }
      );

      const driver = new Driver(mockedStorage);

      const component = driver.getComponent(expected);

      expect(component.version).toBe(expected.version);
      expect(component.getCode()).toBe(expected.getCode());
    });

    it('should throw error for missing component version', () => {
      const hostId = 'id';

      const expected = {
        name: 'compA',
        version: '2.0.0',
        getCode
      };

      const index: Index = {
        [hostId]: {
          dependencies: {},
          components: {
            [expected.name]: expected.version
          }
        }
      };

      const mockedStorage = new MockStorage(index);

      mockedStorage.getComponent = () => undefined;

      const driver = new Driver(mockedStorage);

      const result = expect(() => {
        driver.getComponent({
          hostId,
          name: componentName,
          version: '3.0.0'
        });
      });

      result.toThrowError(new NoComponentError({ expected }));
    });

    it('should throw error for missing component', () => {
      const hostId = 'id';

      const index: Index = {
        [hostId]: {
          dependencies: {},
          components: {}
        }
      };

      const mockedStorage = new MockStorage(index);
      const driver = new Driver(mockedStorage);

      const result = expect(() => {
        driver.getComponent({
          hostId,
          name: componentName
        });
      });

      result.toThrowError(new NoComponentError({ hostId }));
    });

    it('should throw error for missing host', () => {
      const hostId = 'id';

      const mockedStorage = new MockStorage();
      const driver = new Driver(mockedStorage);

      const result = expect(() => {
        driver.getComponent({
          hostId,
          name: componentName
        });
      });

      result.toThrowError(new UnknownHostIdError({ hostId }));
    });
  });

  describe('registerHost', () => {
    it('should return id', () => {
      const mockedStorage = new MockStorage();
      const driver = new Driver(mockedStorage);
      const { id } = driver.registerHost();

      expect(id).toBeDefined();
    });

    it('should return different id for different host dependencies', () => {
      const mockedStorage = new MockStorage();
      const driver = new Driver(mockedStorage);

      const { id: id1 } = driver.registerHost({
        depA: '1.0.0'
      });

      const { id: id2 } = driver.registerHost({
        depA: '1.0.0',
        depB: '1.0.0'
      });

      expect(id1).not.toBe(id2);
    });

    it('should return different id for different host dependencies versions', () => {
      const mockedStorage = new MockStorage();
      const driver = new Driver(mockedStorage);

      const { id: id1 } = driver.registerHost({
        depA: '1.0.0',
        depB: '1.0.0'
      });

      const { id: id2 } = driver.registerHost({
        depA: '1.0.0',
        depB: '1.0.1'
      });

      expect(id1).not.toBe(id2);
    });

    it('should return the same id regardless of dependencies order', () => {
      const mockedStorage = new MockStorage();
      const driver = new Driver(mockedStorage);

      const { id: id1 } = driver.registerHost({
        depA: '1.0.0',
        depB: '1.0.0'
      });

      const { id: id2 } = driver.registerHost({
        depB: '1.0.0',
        depA: '1.0.0'
      });

      expect(id1).toBe(id2);
    });

    describe('upsertIndex', () => {
      it('should not upsert index when host id exists', () => {
        const mockedStorage = new MockStorage();
        const driver = new Driver(mockedStorage);

        expect(Object.keys(mockedStorage.getIndex()).length).toBe(0);

        driver.registerHost({
          depA: '1.0.0',
          depB: '1.0.0'
        });

        expect(Object.keys(mockedStorage.getIndex()).length).toBe(1);

        driver.registerHost({
          depA: '1.0.0',
          depB: '1.0.0'
        });

        expect(Object.keys(mockedStorage.getIndex()).length).toBe(1);
      });

      describe('upsert index for non existent host id', () => {
        it('should create new index entry when index is empty', () => {
          const mockedStorage = new MockStorage();
          const driver = new Driver(mockedStorage);

          expect(Object.keys(mockedStorage.getIndex()).length).toBe(0);

          driver.registerHost({
            depA: '1.0.0',
            depB: '1.0.0'
          });

          expect(Object.keys(mockedStorage.getIndex()).length).toBe(1);
        });

        it('should save declared dependencies in host index entry', () => {
          const mockedStorage = new MockStorage();
          const driver = new Driver(mockedStorage);

          const deps = {
            depA: '1.0.0',
            depB: '1.0.0'
          };

          const { id } = driver.registerHost(deps);

          expect(mockedStorage.getIndex()[id].dependencies).toBe(deps);
        });

        describe('host is compatible with component', () => {
          it('should components under components section', () => {
            const expected = {
              name: 'compA',
              version: '1.0.0'
            };

            const deps = {
              depA: '^1.0.0',
              depB: '^1.0.0'
            };

            const mockedStorage = new MockStorage(
              {},
              {
                [expected.name]: {
                  [expected.version]: () => deps
                }
              }
            );

            const driver = new Driver(mockedStorage);

            const { id } = driver.registerHost(deps);
            const components = mockedStorage.getIndex()[id].components;

            expect(components[expected.name]).toBe(expected.version);
          });

          it('should return a mismatching issue for component dependency with higher version than the host', () => {
            const expected = {
              name: 'compA',
              version: '1.0.0'
            };

            const expectedMismatch = {
              name: 'depA',
              versions: {
                host: '^1.0.0',
                component: '^1.3.0'
              }
            };
            const deps = {
              [expectedMismatch.name]: expectedMismatch.versions.host,
              depB: '^1.0.0'
            };

            const mockedStorage = new MockStorage(
              {},
              {
                [expected.name]: {
                  [expected.version]: () => ({
                    ...deps,
                    [expectedMismatch.name]: expectedMismatch.versions.component
                  })
                }
              }
            );

            const driver = new Driver(mockedStorage);

            const { id, issues } = driver.registerHost(deps);
            const components = mockedStorage.getIndex()[id].components;

            expect(components[expected.name]).toBe(expected.version);
            expect(issues[expected.name]).not.toBeUndefined();
            expect(issues[expected.name].version).toBe(expected.version);
            expect(Object.keys(issues[expected.name].mismatches).length).toBe(1);
            expect(issues[expected.name].mismatches[expectedMismatch.name]).toMatchObject(expectedMismatch.versions);
          });

          it('should add to index only the component version the host is compatible with', () => {
            const expected = {
              name: 'compA',
              version: '1.0.0'
            };

            const expectedToNotBePresent = {
              ...expected,
              version: '2.0.0'
            };

            const deps = {
              depA: '^1.0.0',
              depB: '^1.0.0'
            };

            const depsTheHostIsNotCompatibleWith = {
              ...deps,
              depA: '^2.0.0'
            };

            const mockedStorage = new MockStorage(
              {},
              {
                [expected.name]: {
                  [expected.version]: () => deps,
                  [expectedToNotBePresent.version]: () => depsTheHostIsNotCompatibleWith
                }
              }
            );

            const driver = new Driver(mockedStorage);

            const { id } = driver.registerHost(deps);
            const components = mockedStorage.getIndex()[id].components;

            expect(components[expected.name]).toBe(expected.version);
            expect(components[expected.name]).not.toBe(expectedToNotBePresent.version);
          });

          it('should add to index the latest component version the host is compatible with', () => {
            const expected = {
              name: 'compA',
              version: '2.0.0'
            };

            const expectedToNotBePresent = {
              ...expected,
              version: '1.0.0'
            };

            const deps = {
              depA: '^1.0.0',
              depB: '^1.0.0'
            };

            const mockedStorage = new MockStorage(
              {},
              {
                [expected.name]: {
                  [expected.version]: () => deps,
                  [expectedToNotBePresent.version]: () => deps
                }
              }
            );

            const driver = new Driver(mockedStorage);

            const { id } = driver.registerHost(deps);
            const components = mockedStorage.getIndex()[id].components;

            expect(components[expected.name]).toBe(expected.version);
            expect(components[expected.name]).not.toBe(expectedToNotBePresent.version);
          });
        });

        describe('host can not satisfy component dependencies', () => {
          it(`should not add component to host index when host dependency major version is higher`, () => {
            const deps = {
              depA: '^1.0.0',
              depB: '^1.0.0'
            };

            const mockedStorage = new MockStorage(
              {},
              {
                compA: {
                  '1.0.0': () => ({
                    ...deps,
                    depA: '^0.0.1'
                  })
                }
              }
            );

            const driver = new Driver(mockedStorage);

            const { id } = driver.registerHost(deps);
            const index = mockedStorage.getIndex()[id];

            expect(index).toBeDefined();
            expect(index.components).toEqual({});
          });

          it('should not add component to host index when host is missing component dependency', () => {
            const deps = {
              depB: '^1.0.0'
            };

            const mockedStorage = new MockStorage(
              {},
              {
                compA: {
                  '1.0.0': () => ({
                    depA: '^0.0.1'
                  })
                }
              }
            );

            const driver = new Driver(mockedStorage);

            const { id } = driver.registerHost(deps);
            const index = mockedStorage.getIndex()[id];

            expect(index).toBeDefined();
            expect(index.components).toEqual({});
          });
        });
      });
    });
  });

  describe('saveComponent', () => {
    it('should throw when version is not specified', () => {
      const component = {
        name: 'compA',
        dependencies: {}
      };
      const files = [];

      const mockedStorage = new MockStorage();
      const driver = new Driver(mockedStorage);

      expect(() => driver.saveComponent(component as any, files)).toThrow(new NoComponentVersionError(component));
    });

    it('should throw error when component with the same version already exists in storage', () => {
      const component = {
        name: 'compA',
        version: '1.0.0',
        dependencies: {}
      };

      const files = [];

      const mockedStorage = new MockStorage(
        {},
        {
          [component.name]: {
            [component.version]: () => ({})
          }
        }
      );
      const driver = new Driver(mockedStorage);

      expect(() => driver.saveComponent(component, files)).toThrow(new ComponentExistsError(component));
    });

    it('should throw error when package.json file is missing', () => {
      const component = {
        name: 'compA',
        version: '1.0.0',
        dependencies: {}
      };

      const files = [];

      const mockedStorage = new MockStorage();
      const driver = new Driver(mockedStorage);
      expect(() => driver.saveComponent(component, files)).toThrow(new NoPackageError(component));
    });

    it('should save component to componentTree when component of the same version does not exist and got version and package.json', () => {
      const component = {
        name: 'compA',
        version: '1.0.0',
        dependencies: {}
      };

      const files = [{ name: 'package.json', stream: new Stream() }];

      const mockedStorage = new MockStorage();
      const driver = new Driver(mockedStorage);
      driver.saveComponent(component, files);
      const componentTree = mockedStorage.getComponentTree();
      expect(componentTree[component.name]).toBeDefined();
      expect(componentTree[component.name][component.version]).toBeDefined();
    });

    describe('updateHosts', () => {
      it('should not update empty index', () => {
        const component = {
          name: 'compA',
          version: '1.0.0',
          dependencies: {}
        };

        const files = [{ name: 'package.json', stream: new Stream() }];

        const mockedStorage = new MockStorage();
        const driver = new Driver(mockedStorage);
        driver.saveComponent(component, files);
        const index = mockedStorage.getIndex();
        expect(index).toEqual({});
      });

      it('should not add component when index contain same component name with later version', () => {
        const component = {
          name: 'compA',
          version: '1.0.0',
          dependencies: {}
        };

        const existingVersion = '2.0.0';

        const host = {
          id: 'someId',
          dependencies: {},
          components: {
            [component.name]: existingVersion
          }
        };
        const files = [{ name: 'package.json', stream: new Stream() }];

        const mockedStorage = new MockStorage({
          [host.id]: { dependencies: host.dependencies, components: host.components }
        });
        const driver = new Driver(mockedStorage);
        driver.saveComponent(component, files);

        const index = mockedStorage.getIndex();
        expect(index[host.id].components[component.name]).toBe(existingVersion);
      });

      it('should add component when it is not in index and host is compatible', () => {
        const component = {
          name: 'compA',
          version: '1.0.0',
          dependencies: {}
        };
        const host = {
          id: 'someId',
          dependencies: {},
          components: {}
        };
        const files = [{ name: 'package.json', stream: new Stream() }];

        const mockedStorage = new MockStorage({
          [host.id]: { dependencies: host.dependencies, components: host.components }
        });
        const driver = new Driver(mockedStorage);
        driver.saveComponent(component, files);

        const index = mockedStorage.getIndex();

        expect(index[host.id]).toBeDefined();
        expect(index[host.id].components[component.name]).toBeDefined();
        expect(index[host.id].components[component.name]).toBe(component.version);
      });
    });
  });
});
