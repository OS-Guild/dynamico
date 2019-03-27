import compareVersions from 'compare-versions';
import { Stream } from 'stream';

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

  private noComponentError(component: Component) {
    let message = `No result for ${component.name} with app version: ${component.hostVersion}`;

    if (component.version) {
      message = `${message} and component version: ${component.version}`;
    }

    throw new Error(message);
  }

  private sortByVersion(list: string[]): string[] {
    return list.sort((x, y) => compareVersions(y, x));
  }

  private getBestVersion(versionTree: VersionTree, target: Component): ComponentGetter {
    const exactHostVersion = versionTree[target.hostVersion];

    if (exactHostVersion && target.version) {
      const getExactVersionCode = exactHostVersion[target.version];

      if (!getExactVersionCode) {
        throw this.noComponentError(target);
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
      throw this.noComponentError(target);
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

  saveComponent(component: Component, files: File[]): void {
    if (!component.version) {
      throw new Error('Component version should be specified.');
    }
    const componentTree = this.storage.getComponentVersionTree(component.name);

    if (componentTree[component.hostVersion]) {
      const componentGetter = componentTree[component.hostVersion][component.version];

      if (componentGetter) {
        // TODO: Replace with tslint 🙌
        //prettier-ignore
        throw new Error(
          `Can't publish '${component.name}' component version ${component.version} under app version ${component.hostVersion} since it already exists.`
        );
      }
    }

    if (!files.filter(({ name }) => name === 'package.json').length) {
      throw new Error(`missing 'package.json' file when trying to publish '${component.name}' component`);
    }

    this.storage.saveComponent(component, files);
  }
}
