import buildUrl from 'build-url';
import { ComponentGetFailedError } from './errors';
import { StorageController } from './utils/StorageController';

export type Dependencies = Record<string, string>;

export interface Mismatches {
  [dependency: string]: {
    host: string;
    component: string;
  };
}

export type Issues = {
  [component: string]: {
    mismatches: Mismatches;
    version: string;
  };
};

export interface InitOptions {
  prefix?: string;
  url: string;
  cache: Storage;
  dependencies: {
    versions: Dependencies;
    resolvers: Record<string, any>;
  };
  fetcher?: GlobalFetch['fetch'];
  globals?: Record<string, any>;
}

export interface Options {
  componentVersion?: string;
  ignoreCache?: boolean;
  globals?: Record<string, any>;
}

interface RegisterHostResponse {
  id: string;
  issues: Issues;
}

export class DynamicoClient {
  id: string = '';
  url: string;
  dependencies: {
    versions: Dependencies;
    resolvers: Record<string, any>;
  };
  cache: StorageController;
  fetcher: GlobalFetch['fetch'];
  globals: Record<string, any>;

  constructor(options: InitOptions) {
    this.url = options.url;
    this.cache = new StorageController(options.prefix || '@dynamico', options.cache);
    this.dependencies = options.dependencies;
    this.globals = options.globals || {};

    this.checkFetcher(options.fetcher);

    this.fetcher = options.fetcher || fetch.bind(window);
  }

  private handleIssues(issues: Issues): void {
    Object.entries(issues).forEach(([comp, { version, mismatches }]) =>
      Object.entries(mismatches).forEach(([dependency, { host, component }]) =>
        console.warn(
          `${comp}@${version} requires ${dependency}@${component} but host provides ${host}. Please consider upgrade to version ${component}`
        )
      )
    );
  }

  private checkFetcher(fetcher?: GlobalFetch['fetch']) {
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
  }

  private filterMissingDependencies({ versions, resolvers }: DynamicoClient['dependencies']): Dependencies {
    return Object.keys(resolvers).reduce((sum, name) => {
      if (!versions[name]) {
        console.warn(`Missing version specifier for ${name}`);
      }

      return {
        ...sum,
        ...(versions[name] ? { [name]: versions[name] } : undefined)
      };
    }, {});
  }

  private async register(dependencies: Dependencies) {
    const url = buildUrl(this.url, {
      path: '/host/register'
    });

    return await this.fetcher(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dependencies)
    }).then(async (res: Response) => res.json());
  }

  private async fetchJs(name: string, { ignoreCache, componentVersion = undefined }: Options): Promise<string> {
    let latestComponentVersion: string | undefined;

    if (!componentVersion) {
      latestComponentVersion = this.cache.getLatestVersion(name);
    } else if (!ignoreCache && this.cache.has(name, componentVersion)) {
      return (await this.cache.getItem(name, componentVersion)) as string;
    }

    const url = buildUrl(this.url, {
      path: name,
      queryParams: {
        hostId: this.id,
        ...(componentVersion
          ? { componentVersion }
          : latestComponentVersion && !ignoreCache && { latestComponentVersion })
      }
    });

    const { statusCode, version, code } = await this.fetcher(url).then(async (res: Response) => {
      if (!res.ok) {
        throw new ComponentGetFailedError(res.statusText, res);
      }
      return {
        statusCode: res.status,
        version: res.headers.get('dynamico-component-version') as string,
        code: await res.text()
      };
    });

    if (statusCode === 204) {
      return (await this.cache.getItem(name, version)) as string;
    }

    await this.cache.setItem(name, version, code);

    return code;
  }

  async initialize() {
    const versions = this.filterMissingDependencies(this.dependencies);
    const { id, issues }: RegisterHostResponse = await this.register(versions);
    this.id = id;
    this.handleIssues(issues);
  }

  async get(name: string, options: Options = {}) {
    const code = await this.fetchJs(name, options);
    const require = (dep: string) => this.dependencies.resolvers[dep];
    const module: any = {};
    const exports: any = {};
    const args = {
      module,
      exports,
      require,
      ...this.globals,
      ...options.globals
    };

    new Function(...Object.keys(args), code)(...Object.values(args));

    if (module.exports) {
      return module.exports;
    }

    return exports.default;
  }
}
