import { DynamicoClient, Options, Dependencies } from '.';
import { NoopStorage } from './utils/NoopStorage';

export interface DevOptions {
  dependencies: {
    versions: Dependencies;
    resolvers: Record<string, any>;
  };
  callback: Function;
  interval?: number;
  urlOverride?: string;
}

export class DynamicoDevClient extends DynamicoClient {
  callback: Function;
  interval: number;

  private shouldRefresh = false;
  private etag = '';

  constructor({ dependencies, urlOverride, callback, interval = 1000 }: DevOptions) {
    super({
      url: urlOverride || process.env.DYNAMICO_DEVELOPMENT_SERVER || 'http://localhost:8383',
      dependencies,
      cache: new NoopStorage()
    });

    this.callback = callback;
    this.interval = interval;
  }

  async get(name: string, options: Options = {}) {
    const interval = setInterval(async () => {
      const view = await super.get(name, options);

      if (this.shouldRefresh) {
        return this.callback(view);
      }
    }, this.interval);

    return () => {
      clearInterval(interval);
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
