import { Bundler } from 'bili';
import { ExtendRollupConfig } from 'bili/types/types';
import { basename, extname, join, resolve } from 'path';
import { writeFile, mkdirSync, existsSync } from 'fs';
import { promisify } from 'util';

import rollupPeerDepsExternal from 'rollup-plugin-peer-deps-external';
import rollupTypescript2 from 'rollup-plugin-typescript2';

import { getMainFile, getPackageJson, getPackageJsonPath } from './utils';

export const enum Mode {
  production = 'production',
  development = 'development'
}

export interface Options {
  mode?: Mode;
  dir?: string;
  modifyRollupConfig?: ExtendRollupConfig;
}

export default async ({ mode = Mode.development, dir = '.', modifyRollupConfig }: Options = {}): Promise<any> => {
  const isProd = mode === Mode.production;
  const file = getMainFile(dir);
  const rootDir = resolve(process.cwd(), dir);
  const distDir = join(rootDir, './dist');

  const bundler = new Bundler(
    {
      input: file,
      bundleNodeModules: true,
      plugins: {
        'peer-deps-external': true
      },
      resolvePlugins: {
        'peer-deps-external': (options, ...args) =>
          rollupPeerDepsExternal({ ...options, packageJsonPath: getPackageJsonPath(dir) }, ...args),
        typescript2: options => rollupTypescript2({ ...options, tsconfig: join(rootDir, 'tsconfig.json') })
      },
      output: {
        minify: isProd,
        dir: distDir
      },
      extendRollupConfig: modifyRollupConfig
    },
    { rootDir }
  );

  const packageJson = getPackageJson(dir);

  packageJson.main = basename(file, extname(file)) + '.js';

  if (!existsSync(distDir)) {
    mkdirSync(distDir);
  }

  await Promise.all([
    bundler.run({
      write: true,
      watch: !isProd
    }),
    promisify(writeFile)(join(distDir, './package.json'), JSON.stringify(packageJson))
  ]);

  return packageJson;
};
