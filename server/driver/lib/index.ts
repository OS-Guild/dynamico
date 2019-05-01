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
  getDependencies: () => Dependencies;
}

export interface ComponentGetter extends Required<Component> {
  getCode: () => string;
}

export type Dependencies = Record<string, string>;

export type ComponentTree = Record<
  Component['name'],
  Record<ComponentTreeItem['version'], ComponentTreeItem['getDependencies']>
>;

export type Index = Record<
  Host['id'],
  {
    dependencies: Dependencies;
    components: Record<Component['name'], Required<Component>['version']>;
  }
>;

export interface Storage {
  getIndex(): Index;
  upsertIndex(index: Index): void;
  getComponentTree(): ComponentTree;
  getComponent(name: string, version: string): Maybe<ComponentGetter>;
  saveComponent(component: Component, files: File[]): void;
}

export interface Mismatches {
  [dependency: string]: {
    host: string;
    component: string;
  };
}

type Issues<T> = Record<string, Partial<T> & { mismatches: Mismatches }>;

export class Driver {
  constructor(private storage: Storage) {}

  registerHost(dependencies: Dependencies = {}): { id: string; issues: Issues<Component> } {
    let issues = {};

    const sortedDependencies = Object.entries(dependencies).sort(([nameA], [nameB]) => nameA.localeCompare(nameB));
    const id = MurmurHash3(JSON.stringify(sortedDependencies)).result();

    const index = this.storage.getIndex();

    if (!index[id]) {
      issues = this.upsertIndex({
        id,
        dependencies
      });
    }

    return {
      id,
      issues
    };
  }

  private isCompatible(host: Host, comp: ComponentTreeItem): Maybe<{ mismatches: Mismatches }> {
    const compDeps = comp.getDependencies();
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

  private upsertIndex(host: Host): Issues<Component> {
    const tree = this.storage.getComponentTree();
    let incompatibilityIssues: Issues<Component> = {};

    const components = Object.entries(tree).reduce((sum, [name, versionTree]) => {
      const sortedVersions = Object.entries(versionTree).sort(([a], [b]) => compareVersions(b, a));

      const comp = sortedVersions.find(([version, getDependencies]) => {
        const isCompatible = this.isCompatible(host, { name, version, getDependencies });

        if (isCompatible) {
          incompatibilityIssues[name] = {
            version,
            mismatches: isCompatible.mismatches
          };
        }

        return !!isCompatible;
      });

      return {
        ...sum,
        ...(comp ? { [name]: comp[0] } : undefined)
      };
    }, {});

    this.storage.upsertIndex({
      [host.id]: {
        dependencies: host.dependencies,
        components
      }
    });

    return incompatibilityIssues;
  }

  private updateHosts(component: ComponentTreeItem): Issues<Host> {
    const hostIssues = {};

    const index = Object.entries(this.storage.getIndex()).reduce((sum, [id, { dependencies, components }]) => {
      if (components[component.name] && compareVersions(components[component.name], component.version) >= 0) {
        return sum;
      }

      const isCompatible = this.isCompatible({ id, dependencies }, component);

      if (isCompatible) {
        components[component.name] = component.version;
        hostIssues[id] = {
          mismatches: isCompatible.mismatches
        };
      }

      return {
        ...sum,
        [id]: {
          dependencies,
          components
        }
      };
    }, {});

    this.storage.upsertIndex(index);

    return hostIssues;
  }

  getComponent({ hostId = '', name, version }: { hostId?: string } & Component): ComponentGetter {
    if (!version) {
      const index = this.storage.getIndex();

      if (!index[hostId]) {
        throw new UnknownHostIdError({ hostId });
      }

      if (!index[hostId].components[name]) {
        throw new NoComponentError({ name });
      }

      version = index[hostId].components[name];
    }

    const componentGetter = this.storage.getComponent(name, version);

    if (!componentGetter) {
      throw new NoComponentError({ name, version });
    }

    return componentGetter;
  }

  saveComponent(component: Required<Component> & { dependencies: Dependencies }, files: File[]): Issues<Host> {
    if (!component.version) {
      throw new NoComponentVersionError({ component });
    }

    const componentTree = this.storage.getComponentTree();

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

    this.storage.saveComponent(component, files);

    return this.updateHosts({
      ...component,
      getDependencies: () => component.dependencies
    });
  }
}
