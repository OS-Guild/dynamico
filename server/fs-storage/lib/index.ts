import { readFileSync, existsSync, createWriteStream, writeFileSync } from 'fs';
import { sync as mkdirpSync } from 'mkdirp';
import klaw, { Item } from 'klaw-sync';
import { resolve, join, sep } from 'path';
import { Storage, Component, File, Index, ComponentTree, ComponentGetter } from '@dynamico/common-types';

export class FSStorage implements Storage {
  private indexPath: string;

  constructor(private basePath: string = './') {
    this.indexPath = resolve(basePath, 'index.json');
  }

  async getIndex(): Promise<Index> {
    let indexJson = {};

    if (existsSync(this.indexPath)) {
      indexJson = JSON.parse(readFileSync(this.indexPath, 'utf8'));
    }

    return indexJson;
  }

  async upsertIndex(index: Index): Promise<void> {
    writeFileSync(
      this.indexPath,
      JSON.stringify({
        ...this.getIndex(),
        ...index
      })
    );
  }

  async getComponentTree(): Promise<ComponentTree> {
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
            [componentVersion]: async () => require(file.path).peerDependencies
          }
        };
      }, {});
  }

  async getComponent(name: string, version: string): Promise<ComponentGetter | undefined> {
    const path = resolve(join(this.basePath, name, version));

    try {
      const { main } = require(join(path, 'package.json'));

      return {
        name,
        version,
        getCode: async () => readFileSync(resolve(path, main), 'utf8')
      };
    } catch {
      return;
    }
  }

  async saveComponent(component: Required<Component>, files: File[]): Promise<void> {
    if (!files.length) return;

    const componentPath = resolve(join(this.basePath, component.name, component.version));

    mkdirpSync(componentPath);

    files.forEach(({ name, stream }) => {
      stream.pipe(createWriteStream(join(componentPath, name)));
    });
  }
}
