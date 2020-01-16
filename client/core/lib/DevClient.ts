import { DynamicoClient, Options, Dependencies, InitOptions } from '.';
import { NoopStorage } from './utils/NoopStorage';

export interface DevOptions {
  dependencies: {
    versions: Dependencies;
    resolvers: Record<string, any>;
  };
  interval?: number;
  urlOverride?: string;
}

export interface DevGetOptions extends Options {
  callback: (err: Error | undefined, component: any) => void;
  interval?: number;
}

export class DynamicoDevClient {
  url: string;
  cache = new NoopStorage();
  dependencies: InitOptions['dependencies'];
  interval: number;

  constructor({ dependencies, urlOverride, interval = 1000 }: DevOptions) {
    this.url = urlOverride || process.env.DYNAMICO_DEVELOPMENT_SERVER || 'http://localhost:8383';
    this.dependencies = dependencies;
    this.interval = interval;
  }

  get(name: string, { callback, interval, ...options }: DevGetOptions) {
    let shouldRefresh = false;
    let lastEtag = '';

    const fetcher = async (url: string, init?: RequestInit) => {
      const controller = new AbortController();

      return fetch(url, {
        method: 'get',
        ...init,
        signal: controller.signal
      }).then(res => {
        if (init) {
          return Promise.resolve(new Response(JSON.stringify({ id: 'dev', issues: [] })));
        }

        const etag = res.headers.get('etag') as string;

        if (lastEtag === etag) {
          shouldRefresh = false;
          controller.abort();

          return new Response();
        }

        shouldRefresh = true;
        lastEtag = etag;

        return res;
      });
    };

    const client = new DynamicoClient({
      url: this.url,
      dependencies: this.dependencies,
      cache: this.cache,
      fetcher
    });

    const intervalRef = setInterval(() => {
      client.get(name, options).then(
        view => {
          if (shouldRefresh) {
            callback(undefined, view);
          }
        },
        err => callback(err, undefined)
      );
    }, interval || this.interval);

    return () => {
      clearInterval(intervalRef);
    };
  }
}
