import compareVersions from 'compare-versions';

export interface Component {
  name: string;
  appVersion: string;
  version?: string;
}

export interface BetterComponent {
  version: string,
  getComponentCode: GetComponentCallback
}

interface GetComponentCallback {
  (): string;
}

export interface VersionTree {
  [appVersion: string]: {
    [componentVersion: string]: GetComponentCallback;
  };
}

export interface Storage {
  getComponentVersionTree(name: string): VersionTree;
  saveComponent(component: Component, code: string): void;
}

export class Driver {
  constructor(private storage: Storage) { }

  private noComponentError(component: Component) {
    let message = `No result for ${component.name} with app version: ${component.appVersion}`;

    if (component.version) {
      message = `${message} and component version: ${component.version}`;
    }

    throw new Error(message);
  };

  private sortByVersion(list: string[]): string[] {
    return list.sort((x, y) => compareVersions(y, x));
  }

  private getBestVersion(versionTree: VersionTree, target: Component): BetterComponent {
    const exactAppVersion = versionTree[target.appVersion];

    if (exactAppVersion && target.version) {
      const getExactVersionCode = exactAppVersion[target.version];

      if (!getExactVersionCode) {
        throw this.noComponentError(target);
      }

      return {
        version: target.version,
        getComponentCode: getExactVersionCode
      };
    }

    const matchingAppVersion = this.sortByVersion(Object.keys(versionTree))
      .find(version => compareVersions(target.appVersion, version) >= 0);

    if (!matchingAppVersion) {
      throw this.noComponentError(target);
    }

    const [matchingComponentVersion] =
      this.sortByVersion(Object.keys(versionTree[matchingAppVersion]));

    return {
      version: matchingComponentVersion,
      getComponentCode: versionTree[matchingAppVersion][matchingComponentVersion]
    };
  }

  getComponent(component: Component): BetterComponent {
    const componentTree = this.storage.getComponentVersionTree(component.name);

    return this.getBestVersion(componentTree, component);
  }
}