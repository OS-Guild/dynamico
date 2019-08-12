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
  getLatest?: boolean;
  globals?: Record<string, any>;
}

interface RegisterHostResponse {
  id: string;
  issues: Issues;
  index?: Record<string, string>;
}

const enum ReadyState {
  NotInitialized,
  Initializing,
  Ready
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
  index: Record<string, string> = {};

  private readyState: ReadyState = ReadyState.NotInitialized;
  private requestQueue: Function[] = [];

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

  private async register(dependencies: Dependencies): Promise<RegisterHostResponse> {
    const url = buildUrl(this.url, {
      path: '/host/register'
    });

    return await this.fetcher(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dependencies)
    }).then((res: Response) => res.json());
  }

  private async isReady() {
    if (this.readyState === ReadyState.NotInitialized) {
      this.readyState = ReadyState.Initializing;

      await this.initialize();

      this.readyState = ReadyState.Ready;

      this.requestQueue.forEach(handler => handler());
      this.requestQueue = [];
    }

    if (this.readyState !== ReadyState.Ready) {
      await new Promise(resolve => this.requestQueue.push(() => resolve()));
    }

    return true;
  }

  private async fetchJs(name: string, { getLatest, componentVersion }: Options): Promise<string> {
    await this.isReady();

    componentVersion = componentVersion || this.index[name];

    if (!getLatest && componentVersion && this.cache.has(name, componentVersion)) {
      return (await this.cache.getItem(name, componentVersion)) as string;
    }

    const url = buildUrl(this.url, {
      path: name,
      queryParams: {
        hostId: this.id,
        ...(!getLatest ? { componentVersion } : {})
      }
    });

    const { version, code } = await this.fetcher(url).then(async (res: Response) => {
      if (!res.ok) {
        throw new ComponentGetFailedError(res.statusText, res);
      }

      return {
        version: componentVersion || (res.headers.get('dynamico-component-version') as string),
        code: await res.text()
      };
    });

    await this.cache.setItem(name, version, code);

    return code;
  }

  private async initialize() {
    const versions = this.filterMissingDependencies(this.dependencies);
    const { id, issues, index }: RegisterHostResponse = await this.register(versions);

    this.id = id;
    this.index = index || {};

    if (issues) {
      this.handleIssues(issues);
    }
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
