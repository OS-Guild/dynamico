import compareVersions from 'compare-versions';
import semver from 'semver';
import { Stream } from 'stream';
import MurmurHash3 from 'imurmurhash';

import {
  NoComponentError,
  NoComponentVersionError,
  ComponentExistsError,
  NoPackageError,
  UnknownHostIdError
} from './errors';

export type Maybe<T> = T | undefined;

export interface File {
  name: string;
  stream: Stream;
}

export interface Component {
  name: string;
  version?: string;
}

export interface Host {
  id: string;
  dependencies: Dependencies;
}

export interface ComponentTreeItem extends Required<Component> {
  getDependencies: () => Promise<Dependencies>;
}

export interface ComponentGetter extends Required<Component> {
  getCode: () => Promise<string>;
}

export type Dependencies = Record<string, string>;

export type ComponentTree = Record<
  Component['name'],
  Record<ComponentTreeItem['version'], ComponentTreeItem['getDependencies']>
>;

type ComponentVersionMap = Record<Component['name'], Required<Component>['version']>;

export type Index = Record<
  Host['id'],
  {
    dependencies: Dependencies;
    components: ComponentVersionMap;
  }
>;

export interface Storage {
  getIndex(): Promise<Index>;
  upsertIndex(index: Index): Promise<void>;
  getComponentTree(): Promise<ComponentTree>;
  getComponent(name: string, version: string): Promise<Maybe<ComponentGetter>>;
  saveComponent(component: Component, files: File[]): Promise<void>;
}

export interface Mismatches {
  [dependency: string]: {
    host: string;
    component: string;
  };
}

type Issues<T> = Record<string, Partial<T> & { mismatches: Mismatches }>;

export interface HostRegistration {
  id: string;
  issues: Issues<Component>;
  index: ComponentVersionMap;
}

interface UpsertIndexResult {
  issues: Issues<Component>;
  index: ComponentVersionMap;
}

export class Driver {
  constructor(private storage: Storage) {}

  async registerHost(dependencies: Dependencies = {}): Promise<HostRegistration> {
    let result: Maybe<UpsertIndexResult> = undefined;

    const sortedDependencies = Object.entries(dependencies).sort(([nameA], [nameB]) => nameA.localeCompare(nameB));
    const id = MurmurHash3(JSON.stringify(sortedDependencies)).result();

    const index = await this.storage.getIndex();

    if (!index[id]) {
      result = await this.upsertIndex({
        id,
        dependencies
      });
    }

    return {
      id,
      issues: result ? result.issues : {},
      index: result ? result.index : index[id].components
    };
  }

  private async isCompatible(host: Host, comp: ComponentTreeItem): Promise<Maybe<{ mismatches: Mismatches }>> {
    const compDeps = await comp.getDependencies();
    const mismatches: Mismatches = {};

    for (let dep in compDeps) {
      if (!host.dependencies[dep]) {
        return;
      }

      if (!semver.intersects(host.dependencies[dep], compDeps[dep])) {
        return;
      }

      const { version } = semver.minVersion(host.dependencies[dep])!;

      if (!semver.satisfies(version, compDeps[dep])) {
        mismatches[dep] = {
          host: host.dependencies[dep],
          component: compDeps[dep]
        };
      }
    }

    return {
      mismatches
    };
  }

  private async upsertIndex(host: Host): Promise<UpsertIndexResult> {
    const tree = await this.storage.getComponentTree();
    let issues: Issues<Component> = {};

    const components = await Object.entries(tree).reduce(async (sum, [name, versionTree]) => {
      const sortedVersions = Object.entries(versionTree).sort(([a], [b]) => compareVersions(b, a));

      for (const [version, getDependencies] of sortedVersions) {
        const isCompatible = await this.isCompatible(host, { name, version, getDependencies });
        if (isCompatible) {
          issues[name] = {
            version,
            mismatches: isCompatible.mismatches
          };
          return {
            ...(await sum),
            [name]: version
          };
        }
      }
      return sum;
    }, Promise.resolve({}));

    await this.storage.upsertIndex({
      [host.id]: {
        dependencies: host.dependencies,
        components
      }
    });

    return {
      issues,
      index: components
    };
  }

  private async updateHosts(component: ComponentTreeItem): Promise<Issues<Host>> {
    const hostIssues = {};

    const index = await Object.entries(await this.storage.getIndex()).reduce(
      async (sum, [id, { dependencies, components }]) => {
        if (components[component.name] && compareVersions(components[component.name], component.version) >= 0) {
          return sum;
        }

        const isCompatible = await this.isCompatible({ id, dependencies }, component);

        if (isCompatible) {
          components[component.name] = component.version;
          hostIssues[id] = {
            mismatches: isCompatible.mismatches
          };
        }

        return {
          ...(await sum),
          [id]: {
            dependencies,
            components
          }
        };
      },
      Promise.resolve({})
    );

    await this.storage.upsertIndex(index);

    return hostIssues;
  }

  async getComponent({ hostId = '', name, version }: { hostId?: string } & Component): Promise<ComponentGetter> {
    if (!version) {
      const index = await this.storage.getIndex();

      if (!index[hostId]) {
        throw new UnknownHostIdError({ hostId });
      }

      if (!index[hostId].components[name]) {
        throw new NoComponentError({ name });
      }

      version = index[hostId].components[name];
    }

    const componentGetter = await this.storage.getComponent(name, version);

    if (!componentGetter) {
      throw new NoComponentError({ name, version });
    }

    return componentGetter;
  }

  async saveComponent(
    component: Required<Component> & { dependencies: Dependencies },
    files: File[]
  ): Promise<Issues<Host>> {
    if (!component.version) {
      throw new NoComponentVersionError({ component });
    }

    const componentTree = await this.storage.getComponentTree();

    if (componentTree[component.name]) {
      const componentGetter = componentTree[component.name][component.version];

      if (componentGetter) {
        throw new ComponentExistsError({ component });
      }
    }

    if (!files.filter(({ name }) => name === 'package.json').length) {
      throw new NoPackageError({
        component,
        files
      });
    }

    await this.storage.saveComponent(component, files);

    return this.updateHosts({
      ...component,
      getDependencies: async () => component.dependencies
    });
  }
}
