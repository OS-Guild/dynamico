import { DynamicoClient, Options, Dependencies } from '.';
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
  interval: number;

  private shouldRefresh = false;
  private etag = '';
  private client: DynamicoClient;

  constructor({ dependencies, urlOverride, interval = 1000 }: DevOptions) {
    this.client = new DynamicoClient({
      url: urlOverride || process.env.DYNAMICO_DEVELOPMENT_SERVER || 'http://localhost:8383',
      dependencies,
      cache: new NoopStorage(),
      fetcher: this.fetcher
    });

    this.interval = interval;
  }

  get(name: string, { callback, interval, ...options }: DevGetOptions) {
    const intervalRef = setInterval(() => {
      this.client.get(name, options).then(
        view => {
          if (this.shouldRefresh) {
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

  fetcher = async (url: string, init?: RequestInit) => {
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

      if (this.etag === etag) {
        this.shouldRefresh = false;
        controller.abort();

        return new Response();
      }

      this.shouldRefresh = true;
      this.etag = etag;

      return res;
    });
  };
}
