import { readFileSync, existsSync, createWriteStream } from 'fs';
import { sync as mkdirpSync } from 'mkdirp';
import klaw, { Item } from 'klaw-sync';
import { resolve, join, sep } from 'path';
import { Storage, VersionTree, Component, File } from '@dynamico/driver';

export class FSStorage implements Storage {
  constructor(private basePath: string = './') {}

  getComponentVersionTree(name: string): VersionTree {
    const componentPath = resolve(join(this.basePath, name));

    if (!existsSync(componentPath)) {
      return {};
    }

    return klaw(componentPath, { nodir: true })
      .filter((dir: Item): boolean => dir.path.endsWith('package.json'))
      .reduce((tree: VersionTree, file: Item): VersionTree => {
        const [, versionPath] = file.path.split(join(componentPath, sep));

        const [hostVersion, componentVersion] = versionPath.split('/');

        return {
          ...tree,
          [hostVersion]: {
            ...tree[hostVersion],
            [componentVersion]: () => this.getComponent(file.path)
          }
        };
      }, {});
  }

  private getComponent(pkgJson: string): string {
    const { main } = require(pkgJson);

    return readFileSync(resolve(pkgJson, '..', main), 'utf8');
  }

  saveComponent(component: Required<Component>, files: File[]): void {
    if (!files.length) return;

    const componentPath = resolve(join(this.basePath, component.name, component.hostVersion, component.version));

    mkdirpSync(componentPath);

    files.forEach(({ name, stream }) => {
      stream.pipe(createWriteStream(join(componentPath, name)));
    });
  }
}
