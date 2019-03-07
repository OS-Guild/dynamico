import buildUrl from 'build-url';

export interface KeyValue {
  [key: string]: any;
}

export interface InitOptions {
  prefix?: string;
  url: string;
  appVersion: string;
  cache: Storage;
  dependencies: KeyValue;
  fetcher?: GlobalFetch['fetch'];
  globals?: KeyValue;
}

export interface Options {
  componentVersion?: string;
  ignoreCache?: boolean;
  globals?: KeyValue;
}

export class DynamicoClient {
  prefix: string = '@dynamico';
  url: string;
  appVersion: string;
  dependencies: KeyValue;
  cache: Storage;
  fetcher: GlobalFetch['fetch'];
  globals: KeyValue;

  constructor(options: InitOptions) {
    this.prefix = options.prefix || this.prefix;
    this.url = options.url;
    this.appVersion = options.appVersion;
    this.cache = options.cache;
    this.dependencies = options.dependencies;
    this.globals = options.globals || {};

    this.checkFetcher(options.fetcher);

    this.fetcher = options.fetcher || fetch.bind(window);
  }

  checkFetcher(fetcher?: GlobalFetch['fetch']) {
    if (!fetcher && typeof fetch === 'undefined') {
      let library: string = 'unfetch';
      if (typeof window === 'undefined') library = 'node-fetch';
      throw new Error(`
        fetch is not found globally and no fetcher passed, to fix pass a fetch for 
        your environment like https://www.npmjs.com/package/${library}.
      `);
    }
  };

  async fetchJs(name: string, { ignoreCache, componentVersion = undefined }: Options): Promise<string> {
    const buildPath = (base: string): string => buildUrl(base, {
      path: name,
      queryParams: {
        appVersion: this.appVersion,
        ...(componentVersion && { componentVersion })
      }
    });

    const url = buildPath(this.url);
    const cacheKey = buildPath(this.prefix);

    let code = await this.cache.getItem(cacheKey);

    if (!code || ignoreCache) {
      code = await this.fetcher(url)
        .then((res: Response) => res.text()) as string;

      await this.cache.setItem(cacheKey, code);
    }

    return code;
  }

  async get(name: string, options: Options) {
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