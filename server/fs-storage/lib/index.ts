import fs from 'fs';
import klaw, { Item } from 'klaw-sync';
import { resolve, join, sep } from 'path';
import { Storage, VersionTree, Component } from '@dynamico/driver';

export class FSStorage implements Storage {
  constructor(private basePath: string = './') { }

  getComponentVersionTree(name: string): VersionTree {
    const componentPath = resolve(join(this.basePath, name));

    return klaw(componentPath, { nodir: true })
      .filter((dir: Item): boolean => dir.path.endsWith('package.json'))
      .reduce((tree: VersionTree, file: Item): VersionTree => {
        const [, versionPath] = file.path.split(join(componentPath, sep));

        const [appVersion, componentVersion] = versionPath.split('/');

        return {
          ...tree,
          [appVersion]: {
            ...tree[appVersion],
            [componentVersion]: () => this.getComponent(file.path)
          }
        }
      }, {})

  }

  getComponent(pkgJson: string): string {
    const { main } = require(pkgJson);

    return fs.readFileSync(resolve(pkgJson, '..', main), 'utf8');
  }

  saveComponent(component: Component, code: string): void {
    throw new Error("Method not implemented.");
  }
}
