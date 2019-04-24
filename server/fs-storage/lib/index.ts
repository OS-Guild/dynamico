import { readFileSync, existsSync, createWriteStream, writeFileSync } from 'fs';
import { sync as mkdirpSync } from 'mkdirp';
import klaw, { Item } from 'klaw-sync';
import { resolve, join, sep } from 'path';
import { Storage, Component, File, Index, ComponentTree, ComponentGetter } from '@dynamico/driver';

export class FSStorage implements Storage {
  private indexPath: string;

  constructor(private basePath: string = './') {
    this.indexPath = resolve(basePath, 'index.json');
  }

  getIndex(): Index {
    let indexJson = {};

    if (existsSync(this.indexPath)) {
      indexJson = JSON.parse(readFileSync(this.indexPath, 'utf8'));
    }

    return indexJson;
  }

  upsertIndex(index: Index): void {
    writeFileSync(
      this.indexPath,
      JSON.stringify({
        ...this.getIndex(),
        ...index
      })
    );
  }

  getComponentTree(): ComponentTree {
    const basePath = join(resolve(this.basePath), sep);

    return klaw(this.basePath, { nodir: true })
      .filter((dir: Item): boolean => dir.path.endsWith('package.json'))
      .reduce((tree: ComponentTree, file: Item): ComponentTree => {
        const [, componentPath] = file.path.split(basePath);

        const [name, componentVersion] = componentPath.split('/');

        return {
          ...tree,
          [name]: {
            ...tree[name],
            [componentVersion]: () => require(file.path).peerDependencies
          }
        };
      }, {});
  }

  getComponent(name: string, version: string): ComponentGetter | undefined {
    const path = resolve(join(this.basePath, name, version));

    try {
      const { main } = require(join(path, 'package.json'));

      return {
        name,
        version,
        getCode: () => readFileSync(resolve(path, main), 'utf8')
      };
    } catch {
      return;
    }
  }

  saveComponent(component: Required<Component>, files: File[]): void {
    if (!files.length) return;

    const componentPath = resolve(join(this.basePath, component.name, component.version));

    mkdirpSync(componentPath);

    files.forEach(({ name, stream }) => {
      stream.pipe(createWriteStream(join(componentPath, name)));
    });
  }
}
