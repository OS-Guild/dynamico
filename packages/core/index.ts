interface Component {
  code: string,
  version: string
  appVersion: string
}

export interface InitOptions {
  url: string,
  appVersion: string,
  cache: Map<string, Component>
  dependencies: any;
}

interface GetOptions {
  componentVersion?: string,
  userData?: any
  ignoreCache?: boolean,
  globals?: Map<string, any>;
}

export class Dynamico {
  url: string;
  appVersion: string;
  dependencies: any;

  cache: Map<string, Component>;

  constructor(options: InitOptions) {
    this.url = options.url;
    this.appVersion = options.appVersion;
    this.cache = options.cache || new Map();
    this.dependencies = options.dependencies;
  }

  async fetchJs(name: string, options: GetOptions): Promise<Component> {
    if (!this.cache.has(name) || options.ignoreCache) {
      const url = new URL(this.url);
      const componentVersion = options.componentVersion || 'latest';

      const params: { [key: string]: string } = {
        name,
        appVersion: this.appVersion,
        componentVersion
      };

      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
      
      const code = await fetch(url.href)
        .then(res => res.text())
        
      const component = {
        code,
        appVersion: this.appVersion,
        version: componentVersion
      };

      this.cache.set(name, component);

      return component;
    }

    console.log(this.cache.get(name));

    return this.cache.get(name) as Component;
  }

  async get(name: string, options: GetOptions) {
    const { code } = await this.fetchJs(name, options);

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

// let dynamico : Dynamico;

// export default {
//   instance(options: InitOptions) {
//     if (!dynamico) {
//       dynamico = new Dynamico(options);
//     }

//     return dynamico;
//   }
// }