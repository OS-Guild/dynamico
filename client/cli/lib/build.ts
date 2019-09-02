import { Bundler } from 'bili';
import { ExtendRollupConfig } from 'bili/types/types';
import { basename, extname, resolve } from 'path';
import { writeFile, mkdirSync, existsSync } from 'fs';
import { promisify } from 'util';

import rollupPeerDepsExternal from 'rollup-plugin-peer-deps-external';
import rollupTypescript2 from 'rollup-plugin-typescript2';

import { getMainFile, getPackageJson } from './utils';

export const enum Mode {
  production = 'production',
  development = 'development'
}

export interface Options {
  mode?: Mode;
  file?: string;
  modifyRollupConfig?: ExtendRollupConfig;
}

export default async ({ mode = Mode.development, file = getMainFile(), modifyRollupConfig }: Options = {}): Promise<
  any
> => {
  const isProd = mode === Mode.production;
  const bundler = new Bundler({
    input: resolve(process.cwd(), file),
    bundleNodeModules: true,
    plugins: {
      'peer-deps-external': true
    },
    resolvePlugins: {
      'peer-deps-external': rollupPeerDepsExternal,
      typescript2: rollupTypescript2
    },
    output: {
      minify: isProd
    },
    extendRollupConfig: modifyRollupConfig
  });

  const packageJson = getPackageJson();

  packageJson.main = basename(file, extname(file)) + '.js';

  if (!existsSync('./dist')) {
    mkdirSync('./dist');
  }

  await Promise.all([
    bundler.run({
      write: true,
      watch: !isProd
    }),
    promisify(writeFile)('./dist/package.json', JSON.stringify(packageJson))
  ]);

  return packageJson;
};
