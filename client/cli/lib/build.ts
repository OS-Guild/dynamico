import { Bundler } from 'bili';
import { getMainFile } from './utils';

export const enum Mode {
  production = 'production',
  development = 'development'
}

interface Options {
  mode?: Mode;
  file?: string;
}

export default ({ mode = Mode.development, file: input = getMainFile() }: Options = {}): Promise<any> => {
  const isProd = mode === Mode.production;
  const bundler = new Bundler({
    input,
    bundleNodeModules: true,
    plugins: {
      'peer-deps-external': true
    },
    output: {
      minify: isProd
    }
  });

  return bundler.run({
    write: true,
    watch: !isProd
  });
};
