import buildUrl from 'build-url';
import fetch from 'node-fetch';

interface Storage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface InitOptions {
  prefix?: string;
  url: string,
  appVersion: string,
  cache: Storage
  dependencies: any;
  httpClient?: GlobalFetch['fetch'];
}

interface GetOptions {
  componentVersion?: string,
  userData?: any
  ignoreCache?: boolean,
  globals?: {[key: string]: any};
}

export class Dynamico {
  prefix: string = '@dynamico';
  url: string;
  appVersion: string;
  dependencies: any;
  cache: Storage;
  httpClient: any;

  constructor(options: InitOptions) {
    this.prefix = options.prefix || this.prefix;
    this.url = options.url;
    this.appVersion = options.appVersion;
    this.cache = options.cache;
    this.dependencies = options.dependencies;
    this.httpClient = options.httpClient || fetch;
  }  

  async fetchJs(name: string, {ignoreCache, componentVersion = undefined}: GetOptions): Promise<string> {    
    const buildPath = (base: string) : string => buildUrl(base, {
      path: name,
      queryParams: {
        appVersion: this.appVersion,
        ...(componentVersion && {componentVersion})
      }
    });

    const url = buildPath(this.url);
    const cacheKey = buildPath(this.prefix);

    let code = await this.cache.getItem(cacheKey);

    if (!code || ignoreCache) {    
      code = await this.httpClient(url)
        .then((res: Response) => res.text()) as string;

      await this.cache.setItem(cacheKey, code);
    }

    return code;
  }

  async get(name: string, options: GetOptions) {
    const code = await this.fetchJs(name, options);

    const require = (dep: string) => this.dependencies[dep];
    const exports : any = {};
    const args = {
      exports,
      require,
      ...options.globals
    }

    new Function(...Object.keys(args), code)(...Object.values(args));
    
    return exports.default;
  }
}