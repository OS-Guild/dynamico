import { merge } from 'lodash';
import { Stream } from 'stream';

import { Storage, Component, ComponentTree, File, ComponentGetter, Index, Maybe } from '@dynamico/common-types';
import { Driver } from './';
import {
  NoComponentError,
  NoComponentVersionError,
  ComponentExistsError,
  NoPackageError,
  UnknownHostIdError
} from './errors';

const getCode = async () => '';
const getDependencies = async () => ({});
const componentName = 'foo';

class MockStorage implements Storage {
  constructor(private index: Index = {}, private components: ComponentTree = {}) {}

  async getIndex(): Promise<Index> {
    return this.index;
  }

  async upsertIndex(index: Index) {
    this.index = {
      ...this.index,
      ...index
    };
  }

  async getComponentTree(): Promise<ComponentTree> {
    return this.components;
  }

  async getComponent(name: string, version: string): Promise<Maybe<ComponentGetter>> {
    return { name, version, getCode };
  }

  async saveComponent(component: Component, files: File[]) {
    this.components = merge({}, this.components, {
      [component.name]: {
        [component.version!]: () => 'some code'
      }
    });
  }
}

describe('Driver', () => {
  describe('getComponent', () => {
    it('should find specified component in the index', async () => {
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

      const component = await driver.getComponent({
        hostId,
        name: expected.name
      });

      expect(component.version).toBe(expected.version);
      expect(await component.getCode()).toBe(await expected.getCode());
    });

    it('should return specified component version and ignore index', async () => {
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

      const component = await driver.getComponent(expected);

      expect(component.version).toBe(expected.version);
      expect(await component.getCode()).toBe(await expected.getCode());
    });

    it('should throw error for missing component version', async () => {
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

      mockedStorage.getComponent = async () => undefined;

      const driver = new Driver(mockedStorage);

      await expect(
        driver.getComponent({
          hostId,
          name: componentName,
          version: '3.0.0'
        })
      ).rejects.toEqual(new NoComponentError({ expected }));
    });

    it('should throw error for missing component', async () => {
      const hostId = 'id';

      const index: Index = {
        [hostId]: {
          dependencies: {},
          components: {}
        }
      };

      const mockedStorage = new MockStorage(index);
      const driver = new Driver(mockedStorage);

      await expect(
        driver.getComponent({
          hostId,
          name: componentName
        })
      ).rejects.toEqual(new NoComponentError({ hostId }));
    });

    it('should throw error for missing host', async () => {
      const hostId = 'id';

      const mockedStorage = new MockStorage();
      const driver = new Driver(mockedStorage);

      await expect(
        driver.getComponent({
          hostId,
          name: componentName
        })
      ).rejects.toEqual(new UnknownHostIdError({ hostId }));
    });
  });

  describe('registerHost', () => {
    it('should return id', async () => {
      const mockedStorage = new MockStorage();
      const driver = new Driver(mockedStorage);
      const { id } = await driver.registerHost();

      expect(id).toBeDefined();
    });

    it('should return different id for different host dependencies', async () => {
      const mockedStorage = new MockStorage();
      const driver = new Driver(mockedStorage);

      const { id: id1 } = await driver.registerHost({
        depA: '1.0.0'
      });

      const { id: id2 } = await driver.registerHost({
        depA: '1.0.0',
        depB: '1.0.0'
      });

      expect(id1).not.toBe(id2);
    });

    it('should return different id for different host dependencies versions', async () => {
      const mockedStorage = new MockStorage();
      const driver = new Driver(mockedStorage);

      const { id: id1 } = await driver.registerHost({
        depA: '1.0.0',
        depB: '1.0.0'
      });

      const { id: id2 } = await driver.registerHost({
        depA: '1.0.0',
        depB: '1.0.1'
      });

      expect(id1).not.toBe(id2);
    });

    it('should return the same id regardless of dependencies order', async () => {
      const mockedStorage = new MockStorage();
      const driver = new Driver(mockedStorage);

      const { id: id1 } = await driver.registerHost({
        depA: '1.0.0',
        depB: '1.0.0'
      });

      const { id: id2 } = await driver.registerHost({
        depB: '1.0.0',
        depA: '1.0.0'
      });

      expect(id1).toBe(id2);
    });

    it('should return empty components map for empty storage', async () => {
      const mockedStorage = new MockStorage();
      const driver = new Driver(mockedStorage);
      const { index } = await driver.registerHost();

      expect(index).toBeDefined();
      expect(index).toEqual({});
    });

    it('should return matching component for unregistered host', async () => {
      const expected = {
        name: 'compA',
        version: '1.0.0'
      };

      const mockedStorage = new MockStorage(
        {},
        {
          [expected.name]: {
            [expected.version]: async () => ({})
          }
        }
      );
      const driver = new Driver(mockedStorage);
      const { index } = await driver.registerHost();

      expect(index).toBeDefined();
      expect(index).toEqual({
        [expected.name]: expected.version
      });
    });

    it('should return matching component for registered host', async () => {
      const expected = {
        name: 'compA',
        version: '1.0.0',
        getCode
      };

      const hostId = '2231318396'; // murmur hash of empty object;

      const mockIndex: Index = {
        [hostId]: {
          dependencies: {},
          components: {
            [expected.name]: expected.version
          }
        }
      };

      const mockedStorage = new MockStorage(mockIndex, {});
      const driver = new Driver(mockedStorage);
      const { index } = await driver.registerHost();

      expect(index).toBeDefined();
      expect(index).toEqual(mockIndex[hostId].components);
    });

    describe('upsertIndex', () => {
      it('should not upsert index when host id exists', async () => {
        const mockedStorage = new MockStorage();
        const driver = new Driver(mockedStorage);
        expect(Object.keys(await mockedStorage.getIndex()).length).toBe(0);

        await driver.registerHost({
          depA: '1.0.0',
          depB: '1.0.0'
        });

        expect(Object.keys(await mockedStorage.getIndex()).length).toBe(1);

        await driver.registerHost({
          depA: '1.0.0',
          depB: '1.0.0'
        });

        expect(Object.keys(await mockedStorage.getIndex()).length).toBe(1);
      });

      describe('upsert index for non existent host id', () => {
        it('should create new index entry when index is empty', async () => {
          const mockedStorage = new MockStorage();
          const driver = new Driver(mockedStorage);

          expect(Object.keys(await mockedStorage.getIndex()).length).toBe(0);

          await driver.registerHost({
            depA: '1.0.0',
            depB: '1.0.0'
          });

          expect(Object.keys(await mockedStorage.getIndex()).length).toBe(1);
        });

        it('should save declared dependencies in host index entry', async () => {
          const mockedStorage = new MockStorage();
          const driver = new Driver(mockedStorage);

          const deps = {
            depA: '1.0.0',
            depB: '1.0.0'
          };

          const { id } = await driver.registerHost(deps);

          expect((await mockedStorage.getIndex())[id].dependencies).toBe(deps);
        });

        describe('host is compatible with component', () => {
          it('should components under components section', async () => {
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
                  [expected.version]: async () => deps
                }
              }
            );

            const driver = new Driver(mockedStorage);

            const { id } = await driver.registerHost(deps);
            const components = (await mockedStorage.getIndex())[id].components;

            expect(components[expected.name]).toBe(expected.version);
          });

          it('should return a mismatching issue for component dependency with higher version than the host', async () => {
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
                  [expected.version]: async () => ({
                    ...deps,
                    [expectedMismatch.name]: expectedMismatch.versions.component
                  })
                }
              }
            );

            const driver = new Driver(mockedStorage);

            const { id, issues } = await driver.registerHost(deps);
            const components = (await mockedStorage.getIndex())[id].components;

            expect(components[expected.name]).toBe(expected.version);
            expect(issues[expected.name]).not.toBeUndefined();
            expect(issues[expected.name].version).toBe(expected.version);
            expect(Object.keys(issues[expected.name].mismatches).length).toBe(1);
            expect(issues[expected.name].mismatches[expectedMismatch.name]).toMatchObject(expectedMismatch.versions);
          });

          it('should add to index only the component version the host is compatible with', async () => {
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
                  [expected.version]: async () => deps,
                  [expectedToNotBePresent.version]: async () => depsTheHostIsNotCompatibleWith
                }
              }
            );

            const driver = new Driver(mockedStorage);

            const { id } = await driver.registerHost(deps);
            const components = (await mockedStorage.getIndex())[id].components;

            expect(components[expected.name]).toBe(expected.version);
            expect(components[expected.name]).not.toBe(expectedToNotBePresent.version);
          });

          it('should add to index the latest component version the host is compatible with', async () => {
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
                  [expected.version]: async () => deps,
                  [expectedToNotBePresent.version]: async () => deps
                }
              }
            );

            const driver = new Driver(mockedStorage);

            const { id } = await driver.registerHost(deps);
            const components = (await mockedStorage.getIndex())[id].components;

            expect(components[expected.name]).toBe(expected.version);
            expect(components[expected.name]).not.toBe(expectedToNotBePresent.version);
          });
        });

        describe('host can not satisfy component dependencies', () => {
          it(`should not add component to host index when host dependency major version is higher`, async () => {
            const deps = {
              depA: '^1.0.0',
              depB: '^1.0.0'
            };

            const mockedStorage = new MockStorage(
              {},
              {
                compA: {
                  '1.0.0': async () => ({
                    ...deps,
                    depA: '^0.0.1'
                  })
                }
              }
            );

            const driver = new Driver(mockedStorage);

            const { id } = await driver.registerHost(deps);
            const index = (await mockedStorage.getIndex())[id];

            expect(index).toBeDefined();
            expect(index.components).toEqual({});
          });

          it('should not add component to host index when host is missing component dependency', async () => {
            const deps = {
              depB: '^1.0.0'
            };

            const mockedStorage = new MockStorage(
              {},
              {
                compA: {
                  '1.0.0': async () => ({
                    depA: '^0.0.1'
                  })
                }
              }
            );

            const driver = new Driver(mockedStorage);

            const { id } = await driver.registerHost(deps);
            const index = (await mockedStorage.getIndex())[id];

            expect(index).toBeDefined();
            expect(index.components).toEqual({});
          });
        });
      });
    });
  });

  describe('saveComponent', () => {
    it('should throw when version is not specified', async () => {
      const component = {
        name: 'compA',
        dependencies: {}
      };
      const files = [];

      const mockedStorage = new MockStorage();
      const driver = new Driver(mockedStorage);

      await expect(driver.saveComponent(component as any, files)).rejects.toEqual(
        new NoComponentVersionError(component)
      );
    });

    it('should throw error when component with the same version already exists in storage', async () => {
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
            [component.version]: async () => ({})
          }
        }
      );
      const driver = new Driver(mockedStorage);

      await expect(driver.saveComponent(component, files)).rejects.toEqual(new ComponentExistsError(component));
    });

    it('should throw error when package.json file is missing', async () => {
      const component = {
        name: 'compA',
        version: '1.0.0',
        dependencies: {}
      };

      const files = [];

      const mockedStorage = new MockStorage();
      const driver = new Driver(mockedStorage);
      await expect(driver.saveComponent(component, files)).rejects.toEqual(new NoPackageError(component));
    });

    it('should save component to componentTree when component of the same version does not exist and got version and package.json', async () => {
      const component = {
        name: 'compA',
        version: '1.0.0',
        dependencies: {}
      };

      const files = [{ name: 'package.json', stream: new Stream() }];

      const mockedStorage = new MockStorage();
      const driver = new Driver(mockedStorage);
      await driver.saveComponent(component, files);
      const componentTree = await mockedStorage.getComponentTree();
      expect(componentTree[component.name]).toBeDefined();
      expect(componentTree[component.name][component.version]).toBeDefined();
    });

    describe('updateHosts', () => {
      it('should not update empty index', async () => {
        const component = {
          name: 'compA',
          version: '1.0.0',
          dependencies: {}
        };

        const files = [{ name: 'package.json', stream: new Stream() }];

        const mockedStorage = new MockStorage();
        const driver = new Driver(mockedStorage);
        await driver.saveComponent(component, files);
        const index = await mockedStorage.getIndex();
        expect(index).toEqual({});
      });

      it('should not add component when index contain same component name with later version', async () => {
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
        await driver.saveComponent(component, files);

        const index = await mockedStorage.getIndex();
        expect(index[host.id].components[component.name]).toBe(existingVersion);
      });

      it('should add component when it is not in index and host is compatible', async () => {
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
        await driver.saveComponent(component, files);

        const index = await mockedStorage.getIndex();

        expect(index[host.id]).toBeDefined();
        expect(index[host.id].components[component.name]).toBeDefined();
        expect(index[host.id].components[component.name]).toBe(component.version);
      });
    });
  });
});
