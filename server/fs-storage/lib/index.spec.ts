import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { Dependencies } from '@dynamico/common-types';

import { FSStorage } from '.';

interface Component {
  name: string;
  version: string;
  code: string;
  peerDependencies?: Dependencies;
}

describe('File system storage provider', () => {
  const tmpdir = path.join(os.tmpdir(), 'fs-storage-tests');

  const prepareComponent = (comp: Component) => {
    const componentPath = path.join(tmpdir, comp.name, comp.version);
    fs.outputFileSync(path.join(componentPath, 'index.js'), comp.code);
    fs.outputFileSync(
      path.join(componentPath, 'package.json'),
      JSON.stringify({ main: 'index.js', peerDependencies: comp.peerDependencies })
    );
  };

  beforeEach(() => fs.mkdirSync(tmpdir));
  afterEach(() => fs.removeSync(tmpdir));

  describe('getComponentTree', () => {
    it('should return an empty version tree for no components', async () => {
      const storage = new FSStorage(tmpdir);
      const result = await storage.getComponentTree();

      expect(result).toEqual({});
    });

    it('should return multiple versions for component in version tree', async () => {
      const compA = {
        name: 'name',
        version: '1.0.0',
        code: 'some code',
        peerDependencies: {
          depA: '1.0.0'
        }
      };

      const compB = {
        name: 'name',
        version: '1.0.1',
        code: 'some code 2',
        peerDependencies: {
          depA: '1.0.0',
          depB: '1.0.0'
        }
      };

      prepareComponent(compA);
      prepareComponent(compB);

      const storage = new FSStorage(tmpdir);
      const result = await storage.getComponentTree();

      expect(result).toBeDefined();
      expect(result[compA.name]).toBeDefined();
      expect(result[compA.name][compA.version]).toBeDefined();
      expect(await result[compA.name][compA.version]()).toMatchObject(compA.peerDependencies);

      expect(result[compB.name]).toBeDefined();
      expect(result[compB.name][compB.version]).toBeDefined();
      expect(await result[compB.name][compB.version]()).toMatchObject(compB.peerDependencies);
    });

    it('should return multiple components version tree', async () => {
      const compA = {
        name: 'nameA',
        version: '1.0.0',
        code: 'some code',
        peerDependencies: {
          depA: '1.0.0'
        }
      };

      const compB = {
        name: 'nameB',
        version: '1.0.0',
        code: 'some code 2',
        peerDependencies: {
          depB: '1.0.0'
        }
      };

      prepareComponent(compA);
      prepareComponent(compB);

      const storage = new FSStorage(tmpdir);
      const result = await storage.getComponentTree();

      expect(result).toBeDefined();
      expect(result[compA.name]).toBeDefined();
      expect(result[compA.name][compA.version]).toBeDefined();
      expect(await result[compA.name][compA.version]()).toMatchObject(compA.peerDependencies);

      expect(result[compB.name]).toBeDefined();
      expect(result[compB.name][compB.version]).toBeDefined();
      expect(await result[compB.name][compB.version]()).toMatchObject(compB.peerDependencies);
    });
  });

  describe('getComponent', () => {
    it('should return undefined for non existant component', async () => {
      const storage = new FSStorage(tmpdir);

      const result = await storage.getComponent('no way this exists', '1.0.0');

      expect(result).toBeUndefined();
    });

    it('should return component from filesystem', async () => {
      const comp = {
        name: 'name',
        version: '1.0.0',
        code: 'some code'
      };

      prepareComponent(comp);

      const storage = new FSStorage(tmpdir);
      const result = await storage.getComponent(comp.name, comp.version)!;

      expect(result).toBeDefined();
      const definedResult = result as any; // Prevent TS error on result might be undefined
      expect(definedResult.name).toBe(comp.name);
      expect(definedResult.version).toBe(comp.version);
      expect(await definedResult.getCode()).toBe(comp.code);
    });
  });
});
