import fs from 'fs-extra';
import os from 'os';
import path from 'path';

import { FSStorage } from '.';

describe('File system storage provider', () => {
  const tmpdir = path.join(os.tmpdir(), 'fs-storage-tests');

  beforeEach(() => fs.mkdirpSync(tmpdir));
  afterEach(() => fs.removeSync(tmpdir));

  it('Loads component from filesystem', () => {
    const componentPath = path.join(tmpdir, 'compname', 'appversion', 'compversion');
    fs.outputFileSync(path.join(componentPath, 'index.js'), 'some code');
    fs.outputFileSync(path.join(componentPath, 'package.json'), JSON.stringify({ main: 'index.js' }));

    const storage = new FSStorage(tmpdir);
    const result = storage.getComponentVersionTree('compname');

    expect(result).toHaveProperty('appversion');
    expect(result.appversion).toHaveProperty('compversion');
    expect(result.appversion.compversion()).toBe('some code');
  });
});
