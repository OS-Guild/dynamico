import compareVersions from 'compare-versions';
import { Stream } from 'stream';
import { NoComponentError, NoComponentVersionError, ComponentExistsError, NoPackageError } from './errors';

interface GetComponentCallback {
  (): string;
}

export interface File {
  name: string;
  stream: Stream;
}

export interface Component {
  name: string;
  hostVersion: string;
  version?: string;
}

export interface ComponentGetter extends Required<Component> {
  getComponentCode: GetComponentCallback;
}

export type VersionTree = Record<string, Record<string, GetComponentCallback>>;

export interface Storage {
  getComponentVersionTree(name: string): VersionTree;
  saveComponent(component: Component, files: File[]): void;
}

export class Driver {
  constructor(private storage: Storage) {}

  private sortByVersion(list: string[]): string[] {
    return list.sort((x, y) => compareVersions(y, x));
  }

  private getBestVersion(versionTree: VersionTree, target: Component): ComponentGetter {
    const exactHostVersion = versionTree[target.hostVersion];

    if (exactHostVersion && target.version) {
      const getExactVersionCode = exactHostVersion[target.version];

      if (!getExactVersionCode) {
        throw new NoComponentError(target);
      }

      return {
        name: target.name,
        hostVersion: target.hostVersion,
        version: target.version,
        getComponentCode: getExactVersionCode
      };
    }

    const matchingHostVersion = this.sortByVersion(Object.keys(versionTree)).find(
      version => compareVersions(target.hostVersion, version) >= 0
    );

    if (!matchingHostVersion) {
      throw new NoComponentError(target);
    }

    const [matchingComponentVersion] = this.sortByVersion(Object.keys(versionTree[matchingHostVersion]));

    return {
      name: target.name,
      hostVersion: matchingHostVersion,
      version: matchingComponentVersion,
      getComponentCode: versionTree[matchingHostVersion][matchingComponentVersion]
    };
  }

  getComponent(component: Component): ComponentGetter {
    const componentTree = this.storage.getComponentVersionTree(component.name);

    return this.getBestVersion(componentTree, component);
  }

  saveComponent(component: Required<Component>, files: File[]): void {
    if (!component.version) {
      throw new NoComponentVersionError(component);
    }

    const componentTree = this.storage.getComponentVersionTree(component.name);

    if (componentTree[component.hostVersion]) {
      const componentGetter = componentTree[component.hostVersion][component.version];

      if (componentGetter) {
        throw new ComponentExistsError(component);
      }
    }

    if (!files.filter(({ name }) => name === 'package.json').length) {
      throw new NoPackageError({
        component,
        files
      });
    }

    this.storage.saveComponent(component, files);
  }
}
