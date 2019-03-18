import { DynamicoClient, Options } from '.';
import { NoopStorage } from './utils/NoopStorage';

export interface DevOptions {
  appVersion: string;
  dependencies: Record<string, any>;
  callback: Function;
  interval?: number;
  urlOverride?: string;
}

export class DynamicoDevClient extends DynamicoClient {
  callback: Function;
  interval: number;

  private shouldRefresh = false;
  private etag = '';

  constructor({ appVersion, dependencies, urlOverride, callback, interval = 1000 }: DevOptions) {
    super({
      url: urlOverride || process.env.DYNAMICO_DEVELOPMENT_SERVER || 'http://localhost:8383',
      appVersion,
      dependencies,
      cache: new NoopStorage(),
      fetcher: (url: string) => this._fetcher(url)
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

  private async _fetcher(url: string) {
    const controller = new AbortController();

    return fetch(url, {
      method: 'get',
      signal: controller.signal
    }).then(res => {
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
  }
}
