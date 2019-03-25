import deepmerge from 'deepmerge';
import compareVersions from 'compare-versions';

export class StorageController {
  separator = '/';

  componentTree: Record<string, Record<string, string[]>> = {};

  constructor(private prefix: string, private hostVersion: string, private storage: Storage) {
    this.componentTree = Object.keys(this.storage)
      .map(key => {
        const [, comp, hostVersion, componentVersion] = key.split(this.separator);

        return {
          [comp]: {
            [hostVersion]: [componentVersion]
          }
        };
      })
      .reduce((tree, key) => deepmerge(tree, key), {});
  }

  getStorageKey(name: string, componentVersion: string): string {
    return [this.prefix, name, this.hostVersion, componentVersion].join(this.separator);
  }

  getLatestVersion(name: string): string | undefined {
    if (!this.componentTree[name] || !this.componentTree[name][this.hostVersion]) {
      return;
    }

    const [latestComponentVersion] = this.componentTree[name][this.hostVersion].sort((x: string, y: string) =>
      compareVersions(y, x)
    );

    return latestComponentVersion;
  }

  has(name: string, componentVersion: string): boolean {
    return !!(
      this.componentTree[name] &&
      this.componentTree[name][this.hostVersion] &&
      this.componentTree[name][this.hostVersion].includes(componentVersion)
    );
  }

  async getItem(name: string, componentVersion: string): Promise<string | null> {
    return await this.storage.getItem(this.getStorageKey(name, componentVersion));
  }

  async setItem(name: string, componentVersion: string, code: string): Promise<void> {
    if (!this.componentTree[name]) {
      this.componentTree[name] = {};
    }

    if (!this.componentTree[name][this.hostVersion]) {
      this.componentTree[name][this.hostVersion] = [];
    }

    if (!this.componentTree[name][this.hostVersion].includes(componentVersion)) {
      this.componentTree[name][this.hostVersion].push(componentVersion);
    }

    await this.storage.setItem(this.getStorageKey(name, componentVersion), code);
  }
}
