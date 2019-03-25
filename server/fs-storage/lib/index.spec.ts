import fs from 'fs-extra';
import os from 'os';
import path from 'path';

import { FSStorage } from '.';

describe('File system storage provider', () => {
  const tmpdir = path.join(os.tmpdir(), 'fs-storage-tests');

  beforeEach(() => fs.mkdirpSync(tmpdir));
  afterEach(() => fs.removeSync(tmpdir));

  it('should return an empty version tree for a non-existing component', () => {
    const storage = new FSStorage(tmpdir);
    const result = storage.getComponentVersionTree('compname');

    expect(result).toEqual({});
  });

  it('Loads component from filesystem', () => {
    const componentPath = path.join(tmpdir, 'compname', 'hostVersion', 'compversion');
    fs.outputFileSync(path.join(componentPath, 'index.js'), 'some code');
    fs.outputFileSync(path.join(componentPath, 'package.json'), JSON.stringify({ main: 'index.js' }));

    const storage = new FSStorage(tmpdir);
    const result = storage.getComponentVersionTree('compname');

    expect(result).toHaveProperty('hostVersion');
    expect(result.hostVersion).toHaveProperty('compversion');
    expect(result.hostVersion.compversion()).toBe('some code');
  });
});
