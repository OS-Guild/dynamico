import buildUrl from 'build-url';

import { StorageController } from './utils/StorageController';

export interface InitOptions {
  prefix?: string;
  url: string;
  appVersion: string;
  cache: Storage;
  dependencies: Record<string, any>;
  fetcher?: GlobalFetch['fetch'];
  globals?: Record<string, any>;
}

export interface Options {
  componentVersion?: string;
  ignoreCache?: boolean;
  globals?: Record<string, any>;
}

export class DynamicoClient {
  url: string;
  appVersion: string;
  dependencies: Record<string, any>;
  cache: StorageController;
  fetcher: GlobalFetch['fetch'];
  globals: Record<string, any>;

  constructor(options: InitOptions) {
    this.url = options.url;
    this.appVersion = options.appVersion;
    this.cache = new StorageController(options.prefix || '@dynamico', options.appVersion, options.cache);
    this.dependencies = options.dependencies;
    this.globals = options.globals || {};

    this.checkFetcher(options.fetcher);

    this.fetcher = options.fetcher || fetch.bind(window);
  }

  checkFetcher(fetcher?: GlobalFetch['fetch']) {
    if (!fetcher && typeof fetch === 'undefined') {
      let library: string = 'unfetch';

      if (typeof window === 'undefined') {
        library = 'node-fetch';
      }
      
      throw new Error(`
        fetch is not found globally and no fetcher passed, to fix pass a fetch for 
        your environment like https://www.npmjs.com/package/${library}.
      `);
    }
  };

  async fetchJs(name: string, { ignoreCache, componentVersion = undefined }: Options): Promise<string> {
    let latestComponentVersion: string | undefined;

    if (!componentVersion) {
      latestComponentVersion = this.cache.getLatestVersion(name);
    }
    else if(this.cache.has(name, componentVersion) && !ignoreCache) {
      return await this.cache.getItem(name, componentVersion) as string;
    }

    const url = buildUrl(this.url, {
      path: name,
      queryParams: {
        appVersion: this.appVersion,
        ...(componentVersion ? { componentVersion } : (latestComponentVersion && !ignoreCache && { latestComponentVersion }))
      }
    });

    const { statusCode, version, code } = await this.fetcher(url)
      .then(async (res: Response) => ({
        statusCode: res.status,
        version: res.headers.get('dynamico-component-version') as string,
        code: await res.text()
      }));

    if (statusCode === 204) {
      return await this.cache.getItem(name, version) as string;
    }

    await this.cache.setItem(name, version, code);

    return code;
  }

  async get(name: string, options: Options = {}) {
    const code = await this.fetchJs(name, options);
    const require = (dep: string) => this.dependencies[dep];
    const exports: any = {};
    const args = {
      exports,
      require,
      ...this.globals,
      ...options.globals
    }

    new Function(...Object.keys(args), code)(...Object.values(args));

    return exports.default;
  }
}