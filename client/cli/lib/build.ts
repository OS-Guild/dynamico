import { Bundler } from 'bili';
import { ExtendRollupConfig } from 'bili/types/types';
import { basename, extname, join, resolve } from 'path';
import { writeFile, mkdirSync, existsSync } from 'fs';
import { promisify } from 'util';

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
        'peer-deps-external': { packageJsonPath: getPackageJsonPath(dir) },
        typescript2: { tsconfig: join(rootDir, 'tsconfig.json') }
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
